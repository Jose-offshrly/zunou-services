import AWS from 'aws-sdk'

import { BOT_ID, HEARTBEAT_INTERVAL, MAX_CONCURRENT_MEETINGS } from './constants.ts'
import { env } from './env.ts'
import state from './state.ts'

// Initialize DynamoDB Client
const dynamoDB = new AWS.DynamoDB.DocumentClient({
  endpoint: env.DYNAMODB_ENDPOINT,
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  region: env.AWS_REGION, // Set the AWS region in environment variables
})

// ✅ Function to Mark Meeting as Completed
export async function completeMeeting(meeting_id: string) {
  try {
    await dynamoDB
      .update({
        TableName: env.DYNAMODB_TABLE,
        Key: { meeting_id },
        UpdateExpression: 'SET #status = :completed, meeting_status = :completed, ended_at = :time',
        ExpressionAttributeNames: {
          '#status': 'status' // Use attribute name because 'status' is a reserved word
        },
        ExpressionAttributeValues: {
          ':completed': 'completed',
          ':time': new Date().toISOString(),
        },
      })
      .promise()
    console.log(`✅ Meeting ${meeting_id} marked as completed in DynamoDB.`)
  } catch (error) {
    console.error('❌ Error marking meeting as completed:', error)
  }
}

// ✅ Function to Mark Transcription as Successfully Generated
export async function markTranscriptionSuccess(meeting_id: string) {
  try {
    await dynamoDB
      .update({
        TableName: env.DYNAMODB_TABLE,
        Key: { meeting_id },
        UpdateExpression: 'SET transcription_generated = :success',
        ExpressionAttributeValues: {
          ':success': true,
        },
      })
      .promise()
    console.log(`✅ Meeting ${meeting_id} marked with successful transcription generation in DynamoDB.`)
  } catch (error) {
    console.error('❌ Error marking transcription success:', error)
  }
}

// ✅ Function to Mark Transcription as Failed
export async function markTranscriptionFailure(meeting_id: string) {
  try {
    await dynamoDB
      .update({
        TableName: env.DYNAMODB_TABLE,
        Key: { meeting_id },
        UpdateExpression: 'SET transcription_generated = :failed',
        ExpressionAttributeValues: {
          ':failed': false,
        },
      })
      .promise()
    console.log(`✅ Meeting ${meeting_id} marked with failed transcription generation in DynamoDB.`)
  } catch (error) {
    console.error('❌ Error marking transcription failure:', error)
  }
}

// ✅ Function to Mark Meeting as Not Admitted (bot waited in waiting room but was never accepted)
export async function markMeetingAsNotAdmitted(meeting_id: string) {
  try {
    await dynamoDB
      .update({
        TableName: env.DYNAMODB_TABLE,
        Key: { meeting_id },
        UpdateExpression: 'SET #status = :not_admitted, meeting_status = :not_admitted, ended_at = :time',
        ExpressionAttributeNames: {
          '#status': 'status' // Use attribute name because 'status' is a reserved word
        },
        ExpressionAttributeValues: {
          ':not_admitted': 'not_admitted',
          ':time': new Date().toISOString(),
        },
      })
      .promise()
    console.log(`✅ Meeting ${meeting_id} marked as not_admitted in DynamoDB - bot was not accepted from waiting room.`)
  } catch (error) {
    console.error('❌ Error marking meeting as not_admitted:', error)
  }
}

export function startHeartbeatUpdater(meeting_id: string) {
  if (!state.heartbeatInterval) {
    console.log('⏳ Starting heartbeat updater...')
    let syncCounter = 0
    state.heartbeatInterval = setInterval(async () => {
      if (!state.isBotRunning || !meeting_id) {
        console.log('🛑 Bot stopped or no meeting. Stopping heartbeat updater.')
        if (state.heartbeatInterval) {
          clearInterval(state.heartbeatInterval)
          state.heartbeatInterval = null
        }
        return
      }
      await updateHeartbeat(meeting_id)
      
      // ✅ Sync state with DynamoDB every 3 heartbeats (every 90 seconds)
      syncCounter++
      if (syncCounter >= 3) {
        await syncStateWithDynamoDB(meeting_id)
        syncCounter = 0
      }
    }, HEARTBEAT_INTERVAL)
  }
}

// ✅ Function to Check if a Meeting is Already in Progress
export async function isMeetingAlreadyRecording(meeting_id: string) {
  const result = await dynamoDB
    .get({
      TableName: env.DYNAMODB_TABLE,
      Key: { meeting_id },
      ProjectionExpression: 'meeting_status, #status',
      ExpressionAttributeNames: {
        '#status': 'status'
      }
    })
    .promise()

  return result.Item && (result.Item.meeting_status === 'recording' || result.Item.status === 'recording')
}

// ✅ Function to Check if Meeting is Completed in DynamoDB
export async function isMeetingCompleted(meeting_id: string) {
  try {
    const result = await dynamoDB
      .get({
        TableName: env.DYNAMODB_TABLE,
        Key: { meeting_id },
        ProjectionExpression: 'meeting_status, #status, ended_at',
        ExpressionAttributeNames: {
          '#status': 'status'
        }
      })
      .promise()

    // Check for any end status: completed or not_admitted
    const endStatuses = ['completed', 'not_admitted']
    return result.Item && (
      endStatuses.includes(result.Item.meeting_status) || 
      endStatuses.includes(result.Item.status)
    )
  } catch (error) {
    console.error('❌ Error checking meeting completion status:', error)
    return false
  }
}

// ✅ Function to Get Meeting End Status
export async function getMeetingEndStatus(meeting_id: string) {
  try {
    const result = await dynamoDB
      .get({
        TableName: env.DYNAMODB_TABLE,
        Key: { meeting_id },
        ProjectionExpression: 'meeting_status, #status',
        ExpressionAttributeNames: {
          '#status': 'status'
        }
      })
      .promise()

    if (!result.Item) return null
    
    // Return the specific end status
    const status = result.Item.meeting_status || result.Item.status
    const endStatuses = ['completed', 'not_admitted']
    
    return endStatuses.includes(status) ? status : null
  } catch (error) {
    console.error('❌ Error getting meeting end status:', error)
    return null
  }
}

// ✅ Function to Register Meeting in DynamoDB
export async function registerMeeting(meeting_id: string) {
  try {
    await dynamoDB
      .transactWrite({
        TransactItems: [
          {
            Put: {
              TableName: env.DYNAMODB_TABLE,
              Item: {
                meeting_id,
                bot_id: BOT_ID,
                status: 'waiting_to_join', // Start with waiting status
                meeting_status: 'waiting_to_join', // Keep meeting_status for backward compatibility
                started_at: new Date().toISOString(),
                last_heartbeat: new Date().toISOString(),
              },
              ConditionExpression: 'attribute_not_exists(meeting_id)',
            },
          },
        ],
      })
      .promise()

    console.log(`🔒 Registered meeting ${meeting_id} in DynamoDB.`)
    return true
  } catch (error) {
    if (
      error instanceof Object &&
      'code' in error &&
      error.code === 'TransactionCanceledException'
    ) {
      console.warn(`⚠️ Meeting ${meeting_id} is already being recorded.`)
      return false
    }
    console.error('❌ Error registering meeting in DynamoDB:', error)
    return false
  }
}

// ✅ Function to Update Heartbeat (Keep-Alive)
export async function updateHeartbeat(meeting_id: string) {
  try {
    await dynamoDB
      .update({
        TableName: env.DYNAMODB_TABLE,
        Key: { meeting_id },
        UpdateExpression: 'SET last_heartbeat = :now',
        ExpressionAttributeValues: {
          ':now': new Date().toISOString(),
        },
      })
      .promise()
    console.log(`[${BOT_ID}] 💓 Heartbeat updated for meeting ${meeting_id}`)
  } catch (error) {
    console.error('❌ Error updating heartbeat:', error)
  }
}

// ✅ Function to Get Current Meeting Status from DynamoDB
export async function getCurrentMeetingStatus(meeting_id: string): Promise<string | null> {
  try {
    const result = await dynamoDB
      .get({
        TableName: env.DYNAMODB_TABLE,
        Key: { meeting_id },
        ProjectionExpression: '#status, meeting_status',
        ExpressionAttributeNames: {
          '#status': 'status'
        }
      })
      .promise()

    if (!result.Item) return null
    
    // Return the status (prefer 'status' over 'meeting_status' for consistency)
    return result.Item.status || result.Item.meeting_status || null
  } catch (error) {
    console.error(`❌ Error getting meeting status from DynamoDB:`, error)
    return null
  }
}

// ✅ Function to Sync In-Memory State with DynamoDB Status
export async function syncStateWithDynamoDB(meeting_id: string): Promise<void> {
  try {
    const dbStatus = await getCurrentMeetingStatus(meeting_id)
    if (!dbStatus) return
    
    const state = (await import('./state.ts')).default
    
    // Sync hasJoined flag based on DynamoDB status
    if (dbStatus === 'recording' && !state.hasJoined) {
      console.log(`[${BOT_ID}] Syncing state from DB: status is 'recording', setting hasJoined = true`)
      state.hasJoined = true
      if (!state.joinedAt) {
        state.joinedAt = Date.now()
      }
    } else if (dbStatus === 'waiting_to_join' && state.hasJoined) {
      console.log(`[${BOT_ID}] State mismatch detected - updating DB to 'recording'`)
      await markMeetingAsRecording(meeting_id)
    }
    
    // Sync pause state
    if (dbStatus === 'paused' && !state.isBotPaused) {
      console.log(`[${BOT_ID}] Syncing state from DB: status is 'paused', setting isBotPaused = true`)
      state.isBotPaused = true
    } else if (dbStatus === 'recording' && state.isBotPaused) {
      console.log(`[${BOT_ID}] Syncing state from DB: status is 'recording', setting isBotPaused = false`)
      state.isBotPaused = false
    }
  } catch (error) {
    console.error(`❌ Error syncing state with DynamoDB:`, error)
  }
}

// ✅ Function to Update Meeting Status to Recording (when bot joins)
export async function markMeetingAsRecording(meeting_id: string) {
  try {
    await dynamoDB
      .update({
        TableName: env.DYNAMODB_TABLE,
        Key: { meeting_id },
        UpdateExpression: 'SET #status = :status, meeting_status = :status, joined_at = :timestamp',
        ExpressionAttributeNames: {
          '#status': 'status' // 'status' is a reserved keyword in DynamoDB
        },
        ExpressionAttributeValues: {
          ':status': 'recording',
          ':timestamp': new Date().toISOString(),
        },
      })
      .promise()
    console.log(`[${BOT_ID}] Meeting ${meeting_id} status updated to 'recording'`)
    
    // Update in-memory state to ensure consistency
    const state = (await import('./state.ts')).default
    if (!state.hasJoined) {
      console.log(`[${BOT_ID}] Syncing in-memory state: setting hasJoined = true`)
      state.hasJoined = true
      state.joinedAt = Date.now()
    }
  } catch (error) {
    console.error(`❌ Error updating meeting ${meeting_id} to recording status:`, error)
  }
}

// ✅ Function to Get Count of Active Recording Instances
export async function getActiveInstanceCount() {
  try {
    // First get active recordings, then get total recordings separately
    let activeCount = 0
    let totalRecordings = 0

    // Try querying status_index GSI first (for recordings table) for active recordings
    try {
      const activeResult = await dynamoDB
        .query({
          TableName: env.DYNAMODB_TABLE,
          IndexName: 'status_index',
          KeyConditionExpression: '#status = :status',
          ExpressionAttributeNames: {
            '#status': 'status' // 'status' is a reserved keyword in DynamoDB
          },
          ExpressionAttributeValues: {
            ':status': 'recording',
          },
          ProjectionExpression: 'meeting_id, bot_id, last_heartbeat',
        })
        .promise()

      if (activeResult.Items) {
        // Filter out stale recordings (older than 5 minutes without heartbeat)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const activeInstances = activeResult.Items.filter(item => 
          item.last_heartbeat && item.last_heartbeat > fiveMinutesAgo
        )
        activeCount = activeInstances.length
      }

      // Now get total recordings (including completed ones) by scanning the main table
      const totalResult = await dynamoDB
        .scan({
          TableName: env.DYNAMODB_TABLE,
          FilterExpression: 'attribute_exists(meeting_status)',
          ProjectionExpression: 'meeting_id, meeting_status',
        })
        .promise()

      totalRecordings = totalResult.Items?.length || 0

      console.log(`📊 Found ${activeCount} active recording instances out of ${totalRecordings} total recordings (via status_index + scan)`)
      return {
        activeCount: activeCount,
        totalRecordings: totalRecordings
      }

    } catch (gsiError) {
      console.log('📊 status_index GSI not found, falling back to scan with meeting_status')
      
      // Fallback: scan the table for both active and all recordings
      const allResult = await dynamoDB
        .scan({
          TableName: env.DYNAMODB_TABLE,
          FilterExpression: 'attribute_exists(meeting_status)',
          ProjectionExpression: 'meeting_id, bot_id, last_heartbeat, meeting_status',
        })
        .promise()

      if (!allResult.Items) {
        return { activeCount: 0, totalRecordings: 0 }
      }

      totalRecordings = allResult.Items.length

      // Filter for active recordings only
      const activeRecordings = allResult.Items.filter(item => item.meeting_status === 'recording')
      
      // Filter out stale recordings (older than 5 minutes without heartbeat)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const activeInstances = activeRecordings.filter(item => 
        item.last_heartbeat && item.last_heartbeat > fiveMinutesAgo
      )

      activeCount = activeInstances.length

      console.log(`📊 Found ${activeCount} active recording instances out of ${totalRecordings} total recordings (via scan fallback)`)
      return {
        activeCount: activeCount,
        totalRecordings: totalRecordings
      }
    }
  } catch (error) {
    console.error('❌ Error getting active instance count:', error)
    return { activeCount: 0, totalRecordings: 0 }
  }
}
