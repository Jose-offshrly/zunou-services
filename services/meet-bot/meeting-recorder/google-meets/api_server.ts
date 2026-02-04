import 'dotenv/config'


import amqp from 'amqplib'
import express from 'express'

import { registerCleanup } from './cleanup.ts'
import { BOT_ID } from './constants.ts'
import { registerMeeting, startHeartbeatUpdater, isMeetingCompleted, getActiveInstanceCount } from './dynamo.ts'
import { pauseMeetBot, resumeMeetBot, startMeetBot } from './meetbot.ts'
import {
  connect as connectToMessageBroker,
  state as messageBrokerState,
} from './message_broker.ts'
import state from './state.ts'
import { stopMeetBot } from './stop_meet_bot.ts'
import { type MeetingPlatform } from './utils.ts'

const EXCHANGE_NAME = 'meet-bot-exchange'
const START_QUEUE = 'start-meetings'
const ephemeralQueues = {} as Record<string, {
  name: string
  consumerTag: string
}>

registerCleanup(async (meetingId) => {
  const queue = ephemeralQueues[meetingId]
  if (queue) {
    await messageBrokerState.channel?.cancel(queue.consumerTag)
    delete ephemeralQueues[meetingId]
    console.log(
      `[RabbitMQ] Removed exclusive consumer of ephemeral queue for ${meetingId} (queue should auto-delete shortly after this)`,
    )
  }
})

const app = express()
app.use(express.json())

app.get('/', (req, res) => {
  res.status(200).json({ status: 'healthy' })
})

// Use the scheduler service endpoints which communicate via RabbitMQ to this service
async function setupConsumers(channel: amqp.Channel) {
  await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true })
  await channel.assertQueue(START_QUEUE, { durable: true })
  await channel.bindQueue(START_QUEUE, EXCHANGE_NAME, 'start.meeting')

  await channel.prefetch(1)

  console.log(
    '[Consumer] Waiting for START commands on "start-meetings" queue...',
  )

  // re-create ephemeral (per-meeting) queues and consumers
  for (const meetingId of Object.keys(ephemeralQueues)) {
    // TODO DRY
    const { queue } = await channel.assertQueue('', {
      exclusive: true,
      durable: false,
      autoDelete: true,
    })

    const routingKey = `meeting.${meetingId}.*`
    await channel.bindQueue(queue, EXCHANGE_NAME, routingKey)

    console.log(
      `[Consumer] Bound ephemeral queue "${queue}" for ${meetingId}`,
    )

    const { consumerTag } = await channel.consume(
      queue,
      (meetingMsg) => {
        if (!meetingMsg) return
        handleMeetingCommand(meetingMsg)
      },
      {
        exclusive: true,
        noAck: true,
      },
    )
    ephemeralQueues[meetingId] = {
      name: queue,
      consumerTag
    }
  }

  channel.consume(START_QUEUE, async (msg) => {
    if (!msg) return
    
    if (state.isBotRunning) {
      // There's a free bot available - requeue so it can pick it up
      console.log(`⏭️  [Consumer] Bot busy with meeting ${state.meetingId}, requeueing for available bot`)
      channel.nack(msg, false, true) // Requeue for the free bot to pick up
      return
    }
    
    let payload: Record<string, string>
    try {
      payload = JSON.parse(msg.content.toString())
    } catch (err) {
      console.error('❌ [Consumer] Invalid JSON:', msg.content.toString())
      channel.ack(msg)
      return
    }

    const { command, meetingId, meetingUrl, platform, companionName, meetingType, keyterms } = payload
    if (command === 'start' && meetingId) {
      const normalizedMeetingUrl = meetingUrl || payload.meetUrl
      
      if (!normalizedMeetingUrl) {
        console.error(`❌ [Consumer] Missing meetingUrl in payload for meeting ${meetingId}:`, payload)
        channel.ack(msg)
        return
      }
      
      const normalizedMeetingType = meetingType === 'brain-dump' || meetingType === 'brain_dump' 
        ? 'brain-dump' 
        : 'regular'
      
      if (normalizedMeetingType === 'brain-dump') {
        console.log(`🧠 [Consumer] Brain dump meeting: ${meetingId}`)
      }
      
      // Handle keyterms - can be sent as an array or comma-separated string
      let parsedKeyterms: string[] | undefined
      if (keyterms) {
        if (Array.isArray(keyterms)) {
          parsedKeyterms = keyterms.filter(k => typeof k === 'string' && k.trim().length > 0)
        } else if (typeof keyterms === 'string') {
          parsedKeyterms = keyterms.split(',').map(k => k.trim()).filter(k => k.length > 0)
        }
        
        if (parsedKeyterms && parsedKeyterms.length > 0) {
          console.log(`🎯 [Consumer] Custom keyterms provided: ${parsedKeyterms.length} terms`)
          if (parsedKeyterms.length > 100) {
            console.log(`⚠️ [Consumer] That's a lot of keyterms (${parsedKeyterms.length})! Will trim to 100`)
          }
        }
      }
      
      console.log(`[Consumer] Picked up START for meeting ${meetingId} on platform: ${platform || 'unknown'}`)
      const { queue } = await channel.assertQueue('', {
        exclusive: true,
        durable: false,
        autoDelete: true,
      })

      const routingKey = `meeting.${meetingId}.*`
      await channel.bindQueue(queue, EXCHANGE_NAME, routingKey)

      console.log(
        `[Consumer] Bound ephemeral queue "${queue}" for ${meetingId}`,
      )

      const { consumerTag } = await channel.consume(
        queue,
        (meetingMsg) => {
          if (!meetingMsg) return
          handleMeetingCommand(meetingMsg)
        },
        {
          exclusive: true,
          noAck: true, // should help with 406 PRECONDITION_FAILED errors
        },
      )
      ephemeralQueues[meetingId] = {
        name: queue,
        consumerTag
      }

      if (!state.isBotRunning && (await registerMeeting(meetingId))) {
        console.log(`🎥 Starting meeting ${meetingId} on ${platform || 'unknown'} platform...`)
        startHeartbeatUpdater(meetingId)
        startMeetBot(normalizedMeetingUrl, meetingId, platform as MeetingPlatform, companionName, normalizedMeetingType, parsedKeyterms).catch((err) => {
          console.error('❌ Meetbot error:', err)
          stopMeetBot()
        })
      }
      channel.ack(msg)
    } else {
      console.log('[Consumer] Unknown or invalid start message, discarding.')
      channel.ack(msg)
    }
  })
}

async function handleMeetingCommand(msg: amqp.ConsumeMessage) {
  let payload: Record<string, string>
  try {
    payload = JSON.parse(msg.content.toString())
  } catch (err) {
    console.error('❌ Invalid JSON in meeting command:', msg.content.toString())
    return
  }

  const { command, meetingId } = payload
  console.log(
    `[MeetingConsumer] Received command "${command}" for meeting ${meetingId}`,
  )

  let handled = false

  switch (command) {
    case 'pause':
      if (
        state.isBotRunning &&
        state.meetingId === meetingId &&
        !state.isBotPaused
      ) {
        handled = true
        console.log(`⏸️ Pausing meeting ${meetingId}`)
        pauseMeetBot()
      }
      break
    case 'resume':
      if (
        state.isBotRunning &&
        state.meetingId === meetingId &&
        state.isBotPaused
      ) {
        handled = true
        console.log(`▶️ Resuming meeting ${meetingId}`)
        resumeMeetBot()
      }
      break
    case 'stop':
      if (state.isBotRunning && state.meetingId === meetingId) {
        handled = true
        console.log(`🛑 Stopping meeting ${meetingId}`)
        stopMeetBot()
      }
      break
    case 'status':
      handled = true
      console.log(`📊 [MeetingConsumer] Status request for meeting ${meetingId}`)
      const statusResponse = await generateBotStatusResponse(meetingId)
      console.log(`📊 Bot Status: ${JSON.stringify(statusResponse, null, 2)}`)
      
      // Send response back if replyTo and correlationId are provided
      if (msg.properties?.replyTo && msg.properties?.correlationId) {
        try {
          messageBrokerState.channel?.sendToQueue(
            msg.properties.replyTo,
            Buffer.from(JSON.stringify(statusResponse)),
            {
              correlationId: msg.properties.correlationId
            }
          )
          console.log(`📤 Sent status response back (correlationId: ${msg.properties.correlationId})`)
        } catch (err) {
          console.error('❌ Error sending status response:', err)
        }
      }
      break
    default:
      console.log(`[MeetingConsumer] Unrecognized command "${command}"`)
      break
  }

  if (!handled) {
    console.log(`⚠️ Command '${command}' ignored for meeting ${meetingId}`)
  }
}

// Generate bot status response (extracted from original HTTP endpoint logic)
async function generateBotStatusResponse(requestedMeetingId?: string) {
  try {
    // If a specific meeting_id is requested, check if it matches current meeting
    if (requestedMeetingId) {
      if (state.meetingId !== requestedMeetingId) {
        return {
          error: 'Meeting not found',
          message: `No active meeting with ID: ${requestedMeetingId}`,
          currentMeetingId: state.meetingId,
          botId: BOT_ID,
          timestamp: new Date().toISOString()
        }
      }
    }
    
    // Determine the overall bot status
    let overallStatus = 'idle'
    
    // ✅ Check DynamoDB as the PRIMARY source of truth for status
    if (state.meetingId) {
      const { getCurrentMeetingStatus } = await import('./dynamo.ts')
      const dbStatus = await getCurrentMeetingStatus(state.meetingId)
      
      console.log(`🔍 [${BOT_ID}] Status check - DB: '${dbStatus}', in-memory hasJoined: ${state.hasJoined}, isBotRunning: ${state.isBotRunning}`)
      
      // Map DynamoDB status to API status
      if (dbStatus === 'completed' || dbStatus === 'not_admitted') {
        overallStatus = dbStatus === 'completed' ? 'finished' : 'not_admitted'
      } else if (dbStatus === 'recording') {
        // Bot has joined and is recording
        overallStatus = 'in_meeting'
        // ✅ Sync in-memory state if out of sync
        if (!state.hasJoined) {
          console.log(`⚠️ [${BOT_ID}] Status mismatch detected! DB says 'recording' but hasJoined=false. Syncing...`)
          state.hasJoined = true
        }
      } else if (dbStatus === 'paused') {
        overallStatus = 'paused'
      } else if (dbStatus === 'waiting_to_join') {
        overallStatus = 'waiting_to_join'
      }
      
      // ✅ Fall back to in-memory state checks for transient states (stopping, finalizing)
      // These states are not persisted to DB, so check them from memory
      if (state.isClosing) {
        overallStatus = 'stopping'
      } else if (state.isFinalizing) {
        overallStatus = 'finalizing'
      }
    } else {
      // No active meeting in memory, check in-memory state
      if (state.isClosing) {
        overallStatus = 'stopping'
      } else if (state.isFinalizing) {
        overallStatus = 'finalizing'
      }
    }

    // Get meeting speakers information
    const meetingSpeakers = Array.from(state.meetingSpeakers || [])
    
    // Get total active instance count
    const instanceStats = await getActiveInstanceCount()

    return {
      // Overall status and identification
      status: overallStatus,
      botId: BOT_ID,
      timestamp: new Date().toISOString(),
      
      // Core bot states
      core: {
        isBotRunning: state.isBotRunning,
        isBotPaused: state.isBotPaused,
        hasJoined: state.hasJoined,
        isClosing: state.isClosing,
        isFinalizing: state.isFinalizing
      },
      
      // Current meeting information
      meeting: {
        meetingId: state.meetingId,
        isActiveMeeting: !!state.meetingId,
        currentSpeaker: state.currentSpeaker,
        meetingSpeakers: meetingSpeakers,
        speakerCount: meetingSpeakers.length
      },
      
      // Instance information
      instances: {
        active: instanceStats.activeCount,
        total: instanceStats.totalRecordings,
        maxConcurrentPerInstance: 1, // From MAX_CONCURRENT_MEETINGS constant
        maxInstancesConfigured: process.env.ENVIRONMENT === 'production' ? 2 : 
                               process.env.ENVIRONMENT === 'staging' ? 2 : 0,
        currentBotId: BOT_ID
      },
    }
  } catch (error) {
    console.error('❌ Error generating bot status response:', error)
    return {
      error: 'Failed to get bot status',
      message: error instanceof Error ? error.message : 'Unknown error',
      botId: BOT_ID,
      timestamp: new Date().toISOString()
    }
  }
}

process.on('SIGINT', async () => {
  console.log(`⚠️ [${BOT_ID}] Caught SIGINT. Exiting...`)
  try {
    const meetingId = state.meetingId
    if (meetingId && ephemeralQueues[meetingId] && messageBrokerState.channel) {
      await messageBrokerState.channel.cancel(ephemeralQueues[meetingId].consumerTag)
      console.log(
        `[Cleanup] Removed consumer of ephemeral queue for ${meetingId}`,
      )
    }

    await messageBrokerState.channel?.close()
    await messageBrokerState.connection?.close()

    state.isBotRunning = false

    if (state.activeProcess && typeof state.activeProcess.kill === 'function') {
      state.activeProcess.kill('SIGTERM')
    }
    if (state.activeBrowser) await state.activeBrowser.close()

    process.exit()
  } catch (err) {
    console.error('❌ Error during shutdown:', err)
  } finally {
    process.exit(0)
  }
})

connectToMessageBroker(setupConsumers).then(() => {
  console.log('[Agent] Initial RabbitMQ connection attempt complete.')
})

const PORT = 3000
app.listen(PORT, '0.0.0.0', () =>
  console.log(`🚀 [${BOT_ID}] API Server running on port ${PORT}`),
)
