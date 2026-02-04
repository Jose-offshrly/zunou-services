require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const AWS = require('aws-sdk')
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs')
const amqp = require('amqplib') // Importing amqp for RabbitMQ
const { setupScalingRoutes, getCurrentECSTaskCount } = require('./scaling-api')
const EXCHANGE_NAME = 'meet-bot-exchange'
const RECONNECT_DELAY = 5000 // 5 seconds

const {
  SchedulerClient,
  CreateScheduleCommand,
} = require('@aws-sdk/client-scheduler')

const app = express()
app.use(bodyParser.json())

// Initialize DynamoDB DocumentClient and load table name from env
// Configure DynamoDB client - use IAM role-based auth when available
const dynamoConfig = {
  endpoint: process.env.DYNAMODB_ENDPOINT,
  region: process.env.AWS_REGION,
}

// Only add explicit credentials if they exist (for local development)
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  dynamoConfig.accessKeyId = process.env.AWS_ACCESS_KEY_ID
  dynamoConfig.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
}

const dynamoDB = new AWS.DynamoDB.DocumentClient(dynamoConfig)
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE
const DYNAMODB_RECORDINGS_TABLE = process.env.DYNAMODB_RECORDINGS_TABLE || process.env.DYNAMODB_TABLE

// Initialize EventBridge Scheduler client
// Configure Scheduler client - use IAM role-based auth when available
const schedulerConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.SCHEDULER_ENDPOINT,
}

// Only add explicit credentials if they exist (for local development)
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  schedulerConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
}

const schedulerClient = new SchedulerClient(schedulerConfig)

const AMQP_URL = process.env.AMQP_URL
// We'll create one connection/channel at startup.
let amqpConnection
let amqpChannel
let rabbitReady = false

async function initRabbitMQ() {
  while (!rabbitReady) {
    try {
      console.log('Attempting to connect to RabbitMQ...')
      amqpConnection = await amqp.connect(AMQP_URL)

      // If the connection closes or errors out, re-run initRabbitMQ:
      amqpConnection.on('close', (err) => {
        console.error('❌ RabbitMQ connection closed:', err)
        rabbitReady = false
        setTimeout(initRabbitMQ, RECONNECT_DELAY)
      })
      amqpConnection.on('error', (err) => {
        console.error('❌ RabbitMQ connection error:', err)
        rabbitReady = false
        // The 'error' event may or may not be followed by 'close',
        // but safe to attempt reconnection with a delay
        setTimeout(initRabbitMQ, RECONNECT_DELAY)
      })

      // Create a channel
      amqpChannel = await amqpConnection.createChannel()
      await amqpChannel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true })

      rabbitReady = true
      console.log('✅ RabbitMQ connected and exchange declared.')
    } catch (err) {
      console.error('❌ Error connecting to RabbitMQ:', err)
      rabbitReady = false
      console.log(`Retrying in ${RECONNECT_DELAY}ms...`)
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY))
    }
  }
}

async function sendRabbitCommand(meeting_id, meetUrl, command, platform, passcode = null, companionName = null, meetingType = null) {
  if (!rabbitReady) {
    throw new Error('RabbitMQ not ready')
  }
  
  const routingKey =
    command === 'start' ? 'start.meeting' : `meeting.${meeting_id}.${command}`

  const message = { command, meetingId: meeting_id, meetingUrl: meetUrl, platform, passcode, companionName, meetingType }
  amqpChannel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message)),
    {
      persistent: true,
    },
  )

  console.log(`📤 Sent RabbitMQ '${command}' command for meeting ${meeting_id}`)
}

// Configure SQS client - use IAM role-based auth when available
const sqsConfig = {
  endpoint: process.env.DYNAMODB_ENDPOINT,
}

// Only add explicit credentials if they exist (for local development)
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  sqsConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
}

const sqsClient = new SQSClient(sqsConfig)

// Use the ENVIRONMENT variable to determine which Lambda to call
const ENVIRONMENT = process.env.ENVIRONMENT || 'production'
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL

const lambdaArnMap = {
  development:
    'arn:aws:lambda:ap-northeast-1:322607082550:function:MeetBotTrigger-development',
  staging:
    'arn:aws:lambda:ap-northeast-1:322607082550:function:MeetBotTrigger-staging',
  production:
    'arn:aws:lambda:ap-northeast-1:322607082550:function:MeetBotTrigger-production',
}

const lambdaArn = process.env.LAMBDA_TRIGGER_ARN || lambdaArnMap[ENVIRONMENT]

async function sendMessageToQueues(messageBody, meeting_id) {
  await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: SQS_QUEUE_URL,
      MessageBody: JSON.stringify(messageBody),
    }),
  )
}

// Check if meeting is actively recording before allowing pause/resume
async function isMeetingActivelyRecording(meetingId) {
  try {
    const result = await dynamoDB.get({
      TableName: DYNAMODB_RECORDINGS_TABLE,
      Key: { meeting_id: meetingId },
      ProjectionExpression: 'meeting_id, joined_at, last_heartbeat, #status, meeting_status',
      ExpressionAttributeNames: {
        '#status': 'status'
      }
    }).promise()
    
    if (!result.Item) {
      return { isActive: false, reason: 'Meeting not found in database' }
    }
    
    const meeting = result.Item
    
    // Check if bot has joined the meeting
    if (!meeting.joined_at) {
      return { isActive: false, reason: 'Bot has not joined the meeting yet' }
    }
    
    // Check if heartbeat is recent (within 5 minutes)
    const lastHeartbeat = meeting.last_heartbeat ? new Date(meeting.last_heartbeat) : null
    if (!lastHeartbeat) {
      return { isActive: false, reason: 'No heartbeat detected' }
    }
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    if (lastHeartbeat < fiveMinutesAgo) {
      const ageMinutes = Math.round((Date.now() - lastHeartbeat.getTime()) / (1000 * 60))
      return { isActive: false, reason: `Heartbeat is stale (${ageMinutes} minutes old)` }
    }
    
    // Check if status is appropriate for pause/resume
    const currentStatus = meeting.meeting_status || meeting.status
    if (!['recording', 'paused', 'waiting_to_join'].includes(currentStatus)) {
      return { isActive: false, reason: `Meeting status is '${currentStatus}'` }
    }
    
    return { isActive: true, currentStatus }
  } catch (error) {
    console.error(`Error checking if meeting ${meetingId} is active:`, error)
    return { isActive: false, reason: 'Database error: ' + error.message }
  }
}

// manually pause a Meeting
app.post('/pause-meeting', async (req, res) => {
  const { meeting_id } = req.body

  if (!meeting_id) {
    return res.status(400).json({ error: 'Missing meeting_id' })
  }

  // Check if meeting is actively recording
  const activeCheck = await isMeetingActivelyRecording(meeting_id)
  if (!activeCheck.isActive) {
    return res.status(400).json({ 
      error: 'Cannot pause meeting',
      reason: activeCheck.reason,
      meeting_id
    })
  }

  // Additionally check if it's actually recording (not already paused)
  if (activeCheck.currentStatus === 'paused') {
    return res.status(400).json({ 
      error: 'Cannot pause meeting',
      reason: 'Meeting is already paused',
      meeting_id
    })
  }

  const messageBody = { meeting_id, command: 'pause' }

  try {
    // Try sending to RabbitMQ
    await sendRabbitCommand(meeting_id, null, 'pause', null)

    // ✅ NEW: Update DynamoDB status to 'paused'
    const statusUpdated = await updateMeetingStatus(meeting_id, 'paused')
    
    // Fallback to SQS
    //await sendMessageToQueues(messageBody, meeting_id)

    console.log(
      `[${ENVIRONMENT}] 'pause' command for meeting ${meeting_id} sent to RabbitMQ and SQS`,
    )

    return res.status(200).json({ 
      status: 'paused_rabbitmq_sqs', 
      meeting_id,
      dynamodb_updated: statusUpdated,
      previous_status: activeCheck.currentStatus
    })
  } catch (error) {
    console.error(`[${ENVIRONMENT}] ❌ Error sending pause command:`, error)
    return res.status(500).json({ error: 'Failed to send pause command' })
  }
})

// Manually resume a paused Meeting
app.post('/resume-meeting', async (req, res) => {
  const { meeting_id } = req.body

  if (!meeting_id) {
    return res.status(400).json({ error: 'Missing meeting_id' })
  }

  // Check if meeting is actively recording (should be paused)
  const activeCheck = await isMeetingActivelyRecording(meeting_id)
  if (!activeCheck.isActive) {
    return res.status(400).json({ 
      error: 'Cannot resume meeting',
      reason: activeCheck.reason,
      meeting_id
    })
  }
  
  // Additionally check if it's actually paused
  if (activeCheck.currentStatus !== 'paused') {
    return res.status(400).json({ 
      error: 'Cannot resume meeting',
      reason: `Meeting is not paused (current status: ${activeCheck.currentStatus})`,
      meeting_id
    })
  }

  const messageBody = { meeting_id, command: 'resume' }

  try {
    // Send to RabbitMQ
    await sendRabbitCommand(meeting_id, null, 'resume', null)

    // ✅ NEW: Update DynamoDB status back to 'recording'
    const statusUpdated = await updateMeetingStatus(meeting_id, 'recording')

    // Fallback to SQS
    //await sendMessageToQueues(messageBody, meeting_id)

    console.log(
      `[${ENVIRONMENT}] 'resume' command for meeting ${meeting_id} sent to RabbitMQ and SQS`,
    )

    return res.status(200).json({ 
      status: 'resumed_rabbitmq_sqs', 
      meeting_id,
      dynamodb_updated: statusUpdated,
      previous_status: activeCheck.currentStatus
    })
  } catch (error) {
    console.error(`[${ENVIRONMENT}] ❌ Error sending resume command:`, error)
    return res.status(500).json({ error: 'Failed to send resume command' })
  }
})

// Manually start a Meeting
app.post('/start-meeting', async (req, res) => {
  console.log('📥 Received /start-meeting request:', JSON.stringify(req.body, null, 2))
  
  const { meetUrl, passcode, companionName, meetingType } = req.body
  let { meeting_id, meetingId } = req.body

  if (!meetUrl || typeof meetUrl !== 'string' || meetUrl.trim() === '') {
    console.error('❌ Invalid meetUrl received:', { meetUrl, type: typeof meetUrl, body: req.body })
    return res.status(400).json({ error: 'Missing or invalid meetUrl' })
  }

  // ✅ Accept both meeting_id and meetingId parameter names
  meeting_id = meeting_id || meetingId

  // ✅ Detect meeting platform
  const detectMeetingPlatform = (url) => {
    // Guard clause: handle undefined, null, or empty url
    if (!url || typeof url !== 'string') {
      console.error(`❌ Invalid meetUrl provided to detectMeetingPlatform: ${url}`)
      return 'unknown'
    }
    
    const urlLower = url.toLowerCase()
    
    // Google Meet URL patterns
    if (urlLower.includes('meet.google.com') || urlLower.includes('meet.google.co')) {
      return 'google-meet'
    }
    
    // Microsoft Teams URL patterns (enhanced)
    if (urlLower.includes('teams.microsoft.com') || 
        urlLower.includes('teams.live.com') || 
        urlLower.includes('teams.office.com') ||
        urlLower.includes('teams.microsoft.us') ||
        urlLower.includes('teams.gov.microsoft.us') ||
        urlLower.includes('teams.microsoftonline.com') ||  // Additional Teams domain
        urlLower.includes('/l/meetup-join/') ||             // Teams meeting invite pattern
        urlLower.includes('/meet/') ||                      // Teams meeting pattern
        (urlLower.includes('microsoft') && (urlLower.includes('/teams/') || urlLower.includes('teamsmeetings'))) ||
        urlLower.match(/teams\.microsoft\.[a-z]{2,3}/) ||   // International Teams domains
        urlLower.includes('broadcasting.teams.microsoft.com')) { // Teams Live Events
      return 'teams'
    }
    
    // Zoom URL patterns
    if (urlLower.includes('zoom.us') || 
        urlLower.includes('zoom.com') ||
        urlLower.includes('zoom.') ||
        urlLower.match(/us\d+web\.zoom\.us/) ||
        urlLower.match(/\w+\.zoom\.us/) ||
        (urlLower.includes('/j/') && (urlLower.includes('zoom') || urlLower.match(/\d{9,11}/)))) {
      return 'zoom'
    }
    
    return 'unknown'
  }

  // ✅ Remove passcode from Zoom URL when provided separately
  const removePasscodeFromZoomUrl = (url, hasPasscode = false) => {
    if (!url || typeof url !== 'string' || !hasPasscode) {
      return url
    }
    
    try {
      const urlObj = new URL(url)
      
      // Check if this is a Zoom URL
      const hostname = urlObj.hostname.toLowerCase()
      if (!hostname.includes('zoom.')) {
        return url
      }
      
      // Check if URL has pwd parameter and remove the passcode part
      if (urlObj.searchParams.has('pwd')) {
        const pwdValue = urlObj.searchParams.get('pwd')
        
        // The pwd parameter often has the format: [base].[single_digit][extra_content]
        // We want to remove everything after the first digit following the last period
        const match = pwdValue.match(/^(.+\.\d)(.*)$/)
        if (match && match[2]) {
          // Keep the base part with only one digit after the last period
          const cleanedPwd = match[1]
          urlObj.searchParams.set('pwd', cleanedPwd)
          const cleanedUrl = urlObj.toString()
          console.log(`🧹 Removed passcode from Zoom URL: ${url} → ${cleanedUrl}`)
          return cleanedUrl
        }
      }
      
      // Also check for passcode parameter and remove it completely
      if (urlObj.searchParams.has('passcode')) {
        urlObj.searchParams.delete('passcode')
        const cleanedUrl = urlObj.toString()
        console.log(`🧹 Removed passcode parameter from Zoom URL: ${url} → ${cleanedUrl}`)
        return cleanedUrl
      }
      
      return url
    } catch (error) {
      console.error('❌ Error removing passcode from URL:', error)
      return url
    }
  }

  // ✅ Transform Zoom URLs to standard format if needed
  const transformZoomUrl = (url) => {
    if (!url || typeof url !== 'string') {
      return url
    }
    
    // Check if it's a Zoom URL with regional subdomain pattern (e.g., us04web.zoom.us/j/)
    const zoomRegionalPattern = /^(@?https?:\/\/)(us\d+web\.zoom\.us\/j\/)/i
    
    if (zoomRegionalPattern.test(url)) {
      // Replace regional subdomain pattern with standard zoom.us/wc/join/
      const transformedUrl = url.replace(zoomRegionalPattern, '$1zoom.us/wc/join/')
      console.log(`🔄 Transformed Zoom URL: ${url} → ${transformedUrl}`)
      return transformedUrl
    }
    
    return url
  }
  
  // ✅ Clean the URL by removing passcode if provided separately
  const cleanedMeetUrl = removePasscodeFromZoomUrl(meetUrl, !!passcode)
  const transformedMeetUrl = transformZoomUrl(cleanedMeetUrl)
  const platform = detectMeetingPlatform(transformedMeetUrl)
  
  if (platform === 'unknown') {
    return res.status(400).json({ 
      error: 'Invalid meeting URL. Supported platforms: Google Meet, Microsoft Teams, Zoom',
      supportedUrls: [
        'https://meet.google.com/*',
        'https://teams.microsoft.com/*',
        'https://teams.live.com/*',
        'https://teams.office.com/*',
        'https://zoom.us/j/*',
        'https://*.zoom.us/j/*'
      ]
    })
  }

  // ✅ Use provided meetingId, extract from URL, or generate a new one
  if (!meeting_id) {
    // Try to extract meeting ID from URL for Teams meetings
    if (platform === 'teams') {
      const teamsIdMatch = meetUrl.match(/\/meet\/(\d+)/)
      if (teamsIdMatch) {
        meeting_id = teamsIdMatch[1]
        console.log(`🔍 Extracted Teams meeting ID from URL: ${meeting_id}`)
      }
    }
    
    // Try to extract meeting ID from URL for Zoom meetings
    if (platform === 'zoom') {
      const zoomIdMatch = transformedMeetUrl.match(/\/join\/(\d{9,11})/) || transformedMeetUrl.match(/\/j\/(\d{9,11})/) // Zoom meeting IDs are typically 9-11 digits
      if (zoomIdMatch) {
        meeting_id = zoomIdMatch[1]
        console.log(`🔍 Extracted Zoom meeting ID from URL: ${meeting_id}`)
      }
    }
    
    // Fallback to generated ID if extraction failed
    if (!meeting_id) {
      meeting_id = `manual-${Date.now()}`
    }
  }

  // Handle brain-dump or brain_dump format
  const normalizedMeetingType = meetingType === 'brain-dump' || meetingType === 'brain_dump' 
    ? 'brain-dump' 
    : 'regular'
  
  if (meetingType && normalizedMeetingType === 'brain-dump') {
    console.log(`🧠 Brain dump meeting for ${meeting_id} - using batch-only processing`)
  }

  const messageBody = { meeting_id, meetUrl: transformedMeetUrl, platform, command: 'start', passcode, companionName, meetingType: normalizedMeetingType }

  try {
    // Send to RabbitMQ
    await sendRabbitCommand(meeting_id, transformedMeetUrl, 'start', platform, passcode, companionName, normalizedMeetingType)

    // Fallback to SQS
    //await sendMessageToQueues(messageBody, meeting_id)

    console.log(
      `[${ENVIRONMENT}] Meeting ${meeting_id} sent to RabbitMQ and SQS`,
    )
    return res.status(200).json({ status: 'queued_rabbitmq_sqs', meeting_id })
  } catch (error) {
    console.error(`[${ENVIRONMENT}] ❌ Error sending start command:`, error)
    return res.status(500).json({ error: 'Failed to start meeting' })
  }
})

// Manually stop a Meeting
app.post('/stop-meeting', async (req, res) => {
  const { meeting_id } = req.body

  if (!meeting_id) {
    return res.status(400).json({ error: 'Missing meeting_id' })
  }

  const messageBody = { meeting_id, command: 'stop' }

  try {
    // Send to RabbitMQ
    await sendRabbitCommand(meeting_id, null, 'stop', null)

    // Fallback to SQS
    //await sendMessageToQueues(messageBody, meeting_id)

    console.log(
      `[${ENVIRONMENT}] 'stop' command for meeting ${meeting_id} sent to RabbitMQ and SQS`,
    )

    return res.status(200).json({ status: 'stopped_rabbitmq_sqs', meeting_id })
  } catch (error) {
    console.error(`[${ENVIRONMENT}] ❌ Error sending stop command:`, error)
    return res.status(500).json({ error: 'Failed to send stop command' })
  }
})

app.post('/webhook/calendar', async (req, res) => {
  const meeting = req.body // meeting data should include id, startTime, etc.
  const meetingTime = new Date(meeting.startTime)
  console.log(
    `[${ENVIRONMENT}]Received meeting ${meeting.id} scheduled at ${meetingTime}`,
  )

  // Acquire a lock in DynamoDB to ensure only one schedule per meeting
  try {
    await dynamoDB
      .update({
        TableName: DYNAMODB_TABLE,
        Key: { meeting_id: meeting.id },
        UpdateExpression: 'SET schedule_lock = :locked',
        ConditionExpression: 'attribute_not_exists(schedule_lock)',
        ExpressionAttributeValues: { ':locked': true },
      })
      .promise()
  } catch (err) {
    if (err.code === 'ConditionalCheckFailedException') {
      console.log(
        `[${ENVIRONMENT}] Meeting ${meeting.id} already locked for scheduling, skipping.`,
      )
      return res.status(200).send(`Meeting ${meeting.id} already scheduled.`)
    }
    console.error('Error acquiring scheduling lock:', err)
    return res.status(500).send('Error acquiring scheduling lock.')
  }

  const now = new Date()
  const fiveMinutesBefore = new Date(meetingTime.getTime() - 5 * 60 * 1000)
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)

  let triggerDate

  // Case 1: Meeting started within the last 30 minutes — start immediately
  if (meetingTime < now && meetingTime > thirtyMinutesAgo) {
    triggerDate = now
  }
  // Case 2: Meeting is less than 5 minutes away — start immediately
  else if (now >= fiveMinutesBefore) {
    triggerDate = now
  }
  // Case 3: Meeting is more than 5 minutes away — schedule 5 minutes before
  else {
    triggerDate = fiveMinutesBefore
  }

  // Format the trigger time
  const triggerTime = triggerDate.toISOString().split('.')[0]
  const groupName = `meet-bot-${ENVIRONMENT}`
  // Create a unique schedule name
  const scheduleName = `meeting-${ENVIRONMENT}-${meeting.id}-${Date.now()}`
  const scheduleParams = {
    Name: scheduleName,
    GroupName: groupName,
    ScheduleExpression: `at(${triggerTime})`,
    FlexibleTimeWindow: { Mode: 'OFF' },
    Target: {
      Arn: lambdaArn, // Lambda function ARN
      RoleArn: process.env.SCHEDULER_ROLE_ARN, // IAM Role ARN for EventBridge Scheduler
      Input: JSON.stringify({
        meetingId: meeting.id, // ✅ Explicitly send meetingId
        meetingUrl: meeting.meetingUrl, // ✅ Explicitly send meetingUrl
        scheduleName: scheduleName, // ✅ Pass schedule name for deletion
        groupName: groupName, // ✅ Pass group name for deletion
      }),
    },
  }
  //console.log(scheduleParams)
  let scheduleData
  try {
    scheduleData = await schedulerClient.send(
      new CreateScheduleCommand(scheduleParams),
    )
    console.log(`[${ENVIRONMENT}] Schedule created:`, scheduleData)
  } catch (error) {
    console.error(`[${ENVIRONMENT}] Error scheduling meet-bot trigger:`, error)
    // Remove the lock so scheduling can be retried
    try {
      await dynamoDB
        .update({
          TableName: DYNAMODB_TABLE,
          Key: { meeting_id: meeting.id },
          UpdateExpression: 'REMOVE schedule_lock',
        })
        .promise()
    } catch (updateErr) {
      console.error('Error removing scheduling lock:', updateErr)
    }
    return res.status(500).send('Error scheduling meeting trigger')
  }

  // Update DynamoDB record: mark schedule as created and remove the lock
  try {
    await dynamoDB
      .update({
        TableName: DYNAMODB_TABLE,
        Key: { meeting_id: meeting.id },
        UpdateExpression:
          'SET schedule_created = :true, schedule_name = :sn REMOVE schedule_lock',
        ExpressionAttributeValues: {
          ':true': true,
          ':sn': scheduleName,
        },
      })
      .promise()
    console.log(
      `[${ENVIRONMENT}] Meeting ${meeting.id} updated in DynamoDB with schedule info.`,
    )
  } catch (updateErr) {
    console.error('Error updating DynamoDB with schedule info:', updateErr)
  }
  res
    .status(200)
    .send(
      `Scheduled meet-bot trigger for meeting ${meeting.id} in ${ENVIRONMENT}`,
    )
})

app.get('/', (req, res) => {
  //console.log('✅ Health check received.')
  res.status(200).json({ status: 'healthy' })
})

// S3 client for speaker label updates
const s3Config = {
  region: process.env.AWS_REGION,
  endpoint: process.env.S3_ENDPOINT,
  s3ForcePathStyle: process.env.S3_ENDPOINT?.includes('localstack') || false,
}
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Config.accessKeyId = process.env.AWS_ACCESS_KEY_ID
  s3Config.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
}
const s3 = new AWS.S3(s3Config)

app.post('/update-speaker-labels', async (req, res) => {
  try {
    const { meeting_id, speaker_mapping } = req.body

    if (!meeting_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: meeting_id',
      })
    }

    if (!speaker_mapping || typeof speaker_mapping !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid field: speaker_mapping',
      })
    }

    console.log(`Updating speaker labels for meeting ${meeting_id}`)
    console.log(`Environment check: ENVIRONMENT=${process.env.ENVIRONMENT}, NODE_ENV=${process.env.NODE_ENV}, MEET_BOT_S3_BUCKET=${process.env.MEET_BOT_S3_BUCKET ? 'SET' : 'NOT SET'}`)

    const isLocal = process.env.ENVIRONMENT === 'development' || process.env.NODE_ENV === 'development'
    let fileContent = ''
    let fileKey = ''

    if (isLocal) {
      // Local: Read from filesystem
      const fs = require('fs')
      const path = require('path')
      const recordingsPath = path.join(__dirname, 'meeting-recorder/google-meets/recordings')
      
      // Find the meeting directory
      const meetingDirs = fs.readdirSync(recordingsPath).filter(dir => dir.startsWith(meeting_id))
      if (meetingDirs.length === 0) {
        return res.status(404).json({
          success: false,
          error: `Meeting directory not found for meeting ${meeting_id}`,
        })
      }

      const meetingDir = path.join(recordingsPath, meetingDirs[0])
      const files = fs.readdirSync(meetingDir)
      const labelFile = files.find(f => f.endsWith('_speaker_labels_only.log'))
      
      if (!labelFile) {
        return res.status(404).json({
          success: false,
          error: `Speaker labels file not found for meeting ${meeting_id}`,
        })
      }

      const filePath = path.join(meetingDir, labelFile)
      fileContent = fs.readFileSync(filePath, 'utf-8')
      fileKey = labelFile
    } else {
      // Production: Read from S3
      const bucket = process.env.MEET_BOT_S3_BUCKET
      
      if (!bucket) {
        return res.status(500).json({
          success: false,
          error: 'MEET_BOT_S3_BUCKET environment variable is not configured',
        })
      }
      
      const prefix = `meetings/${meeting_id}/transcriptions/`
      
      const listResponse = await s3.listObjectsV2({ Bucket: bucket, Prefix: prefix }).promise()
      const file = listResponse.Contents?.find((obj) => obj.Key?.endsWith('_speaker_labels_only.log'))
      
      if (!file || !file.Key) {
        return res.status(404).json({
          success: false,
          error: `Speaker labels file not found for meeting ${meeting_id}`,
        })
      }

      const getResponse = await s3.getObject({ Bucket: bucket, Key: file.Key }).promise()
      fileContent = getResponse.Body.toString('utf-8')
      fileKey = file.Key
    }

    // Parse transcription
    const lines = fileContent.split('\n')
    const header = []
    const transcriptionLines = []
    let inHeader = true

    for (const line of lines) {
      if (!line.trim()) {
        if (inHeader) header.push(line)
        continue
      }

      const match = line.match(/^\[([^\]]+)\]\s+Speaker\s+([A-Z]):\s+(.+)$/)
      if (match) {
        inHeader = false
        const [, timestamp, speaker, text] = match
        transcriptionLines.push({ timestamp, speaker, text })
      } else if (inHeader) {
        header.push(line)
      }
    }

    // Extract existing mapping from header
    const existingMapping = {}
    for (const line of header) {
      const match = line.match(/^-\s+Speaker\s+([A-Z])\s+→\s+(.+)$/)
      if (match) {
        const [, speaker, name] = match
        existingMapping[speaker] = name.trim()
      }
    }

    // Merge mappings
    const mergedMapping = { ...existingMapping, ...speaker_mapping }

    // Generate main transcription (no header)
    const mainTranscription = transcriptionLines
      .map(({ timestamp, speaker, text }) => {
        const speakerName = mergedMapping[speaker] || `Speaker ${speaker}`
        return `[${timestamp}] ${speakerName}: ${text}`
      })
      .join('\n') + '\n'

    // Generate with labels transcription
    const headerLines = ['AI Speaker Mapping']
    Object.entries(mergedMapping)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([speaker, name]) => {
        headerLines.push(`- Speaker ${speaker} → ${name}`)
      })
    headerLines.push('')

    const withLabelsTranscription = headerLines.join('\n') + transcriptionLines
      .map(({ timestamp, speaker, text }) => {
        const speakerName = mergedMapping[speaker] || `Speaker ${speaker}`
        return `[${timestamp}] ${speakerName} (Speaker ${speaker}): ${text}`
      })
      .join('\n') + '\n'

    const labelsOnlyTranscription = headerLines.join('\n') + transcriptionLines
      .map(({ timestamp, speaker, text }) => `[${timestamp}] Speaker ${speaker}: ${text}`)
      .join('\n') + '\n'

    // Write updated files
    if (isLocal) {
      // Local: Write to filesystem
      const fs = require('fs')
      const path = require('path')
      const recordingsPath = path.join(__dirname, 'meeting-recorder/google-meets/recordings')
      const meetingDirs = fs.readdirSync(recordingsPath).filter(dir => dir.startsWith(meeting_id))
      const meetingDir = path.join(recordingsPath, meetingDirs[0])
      
      const baseFilename = fileKey.replace('_transcriptions_speaker_labels_only.log', '')
      fs.writeFileSync(path.join(meetingDir, `${baseFilename}_transcriptions.log`), mainTranscription)
      fs.writeFileSync(path.join(meetingDir, `${baseFilename}_transcriptions_with_speaker_labels.log`), withLabelsTranscription)
      fs.writeFileSync(path.join(meetingDir, `${baseFilename}_transcriptions_speaker_labels_only.log`), labelsOnlyTranscription)
    } else {
      // Production: Write to S3
      const bucket = process.env.MEET_BOT_S3_BUCKET
      
      if (!bucket) {
        return res.status(500).json({
          success: false,
          error: 'MEET_BOT_S3_BUCKET environment variable is not configured',
        })
      }
      
      const baseKey = fileKey.replace('_transcriptions_speaker_labels_only.log', '')
      await Promise.all([
        s3.putObject({ Bucket: bucket, Key: `${baseKey}_transcriptions.log`, Body: mainTranscription, ContentType: 'text/plain' }).promise(),
        s3.putObject({ Bucket: bucket, Key: `${baseKey}_transcriptions_with_speaker_labels.log`, Body: withLabelsTranscription, ContentType: 'text/plain' }).promise(),
        s3.putObject({ Bucket: bucket, Key: `${baseKey}_transcriptions_speaker_labels_only.log`, Body: labelsOnlyTranscription, ContentType: 'text/plain' }).promise(),
      ])
    }

    console.log(`Successfully updated speaker labels for meeting ${meeting_id}`)

    res.status(200).json({
      success: true,
      message: 'Speaker labels updated successfully',
      transcription: mainTranscription,
    })
  } catch (error) {
    console.error('Error updating speaker labels:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// Store pending status requests
const pendingStatusRequests = new Map()

// Listen for status responses
async function setupStatusResponseListener() {
  // Create a queue for status responses
  const statusResponseQueue = await amqpChannel.assertQueue('scheduler-status-responses', { 
    durable: false 
  })
  
  amqpChannel.consume(statusResponseQueue.queue, (msg) => {
    if (!msg) return
    
    try {
      const response = JSON.parse(msg.content.toString())
      const correlationId = msg.properties.correlationId
      
      console.log(`📥 Received status response (correlationId: ${correlationId})`)
      
      if (correlationId && pendingStatusRequests.has(correlationId)) {
        const { resolve } = pendingStatusRequests.get(correlationId)
        pendingStatusRequests.delete(correlationId)
        resolve(response)
        console.log(`✅ Resolved status request (correlationId: ${correlationId})`)
      } else {
        console.log(`⚠️  No pending request found for correlationId: ${correlationId}`)
      }
      
      amqpChannel.ack(msg)
    } catch (err) {
      console.error('❌ Error processing status response:', err)
      amqpChannel.ack(msg)
    }
  }, { noAck: false })
  
  console.log('✅ Status response listener set up')
}

// Send status command and wait for response
async function sendStatusCommand(meetingId) {
  if (!meetingId) {
    throw new Error('Meeting ID is required for status requests')
  }
  
  const correlationId = `status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const timeout = 5000 // 5 second timeout
  
  return new Promise((resolve, reject) => {
    // Store the promise resolver
    const timeoutHandle = setTimeout(() => {
      pendingStatusRequests.delete(correlationId)
      reject(new Error('Status request timeout'))
    }, timeout)
    
    pendingStatusRequests.set(correlationId, { 
      resolve: (response) => {
        clearTimeout(timeoutHandle)
        resolve(response)
      }
    })
    
    // Send status command to specific meeting queue
    const routingKey = `meeting.${meetingId}.status`
    const message = { 
      command: 'status', 
      meetingId: meetingId,
      correlationId: correlationId
    }
    
    amqpChannel.publish(
      EXCHANGE_NAME,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: false,
        correlationId: correlationId,
        replyTo: 'scheduler-status-responses'
      }
    )
    
    console.log(`📤 Sent status command for meeting ${meetingId} (correlationId: ${correlationId})`)
  })
}

// Check if meeting is completed in DynamoDB (fallback when bot doesn't respond)
async function checkMeetingCompletion(meetingId) {
  try {
    const result = await dynamoDB.get({
      TableName: DYNAMODB_RECORDINGS_TABLE,
      Key: { meeting_id: meetingId },
      ProjectionExpression: 'meeting_status, ended_at, started_at, bot_id'
    }).promise()
    
    return result.Item || null
  } catch (error) {
    console.error('❌ Error checking meeting completion in DynamoDB:', error)
    return null
  }
}

// ✅ NEW: Update meeting status in DynamoDB
async function updateMeetingStatus(meetingId, status) {
  try {
    await dynamoDB.update({
      TableName: DYNAMODB_RECORDINGS_TABLE,
      Key: { meeting_id: meetingId },
      UpdateExpression: 'SET #status = :status, meeting_status = :status, last_status_update = :timestamp',
      ExpressionAttributeNames: {
        '#status': 'status' // 'status' is a reserved keyword in DynamoDB
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':timestamp': new Date().toISOString()
      }
    }).promise()
    
    console.log(`✅ Updated meeting ${meetingId} status to '${status}' in DynamoDB`)
    return true
  } catch (error) {
    console.error(`❌ Error updating meeting ${meetingId} status to '${status}':`, error)
    return false
  }
}

// ✅ NEW: Get comprehensive meeting status from DynamoDB only
async function getMeetingStatusFromDynamoDB(meetingId) {
  try {
    const result = await dynamoDB.get({
      TableName: DYNAMODB_RECORDINGS_TABLE,
      Key: { meeting_id: meetingId },
      ProjectionExpression: 'meeting_id, bot_id, #status, meeting_status, started_at, ended_at, last_heartbeat, transcription_generated',
      ExpressionAttributeNames: {
        '#status': 'status' // 'status' is a reserved keyword in DynamoDB
      }
    }).promise()
    
    if (!result.Item) {
      return null
    }
    
    const meetingData = result.Item
    const now = new Date()
    const lastHeartbeat = meetingData.last_heartbeat ? new Date(meetingData.last_heartbeat) : null
    
    // Determine overall status based on DynamoDB data
    let overallStatus = 'idle'
    let isActiveMeeting = false
    
    if (meetingData.meeting_status === 'completed' || meetingData.status === 'completed') {
      overallStatus = 'finished'
      isActiveMeeting = false
    } else if (meetingData.meeting_status === 'not_admitted' || meetingData.status === 'not_admitted') {
      overallStatus = 'not_admitted'
      isActiveMeeting = false
    } else if (meetingData.meeting_status === 'paused' || meetingData.status === 'paused') {
      // ✅ Handle paused status
      overallStatus = 'paused'
      isActiveMeeting = true // Meeting is still active, just paused
    } else if (meetingData.meeting_status === 'waiting_to_join' || meetingData.status === 'waiting_to_join') {
      // ✅ NEW: Handle waiting to join status
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      
      if (lastHeartbeat && lastHeartbeat > fiveMinutesAgo) {
        overallStatus = 'waiting_to_join' // Bot is running but hasn't joined yet
        isActiveMeeting = true // Bot is active, just not in meeting yet
      } else {
        overallStatus = 'recorder_unavailable' // Stale heartbeat while waiting
        isActiveMeeting = false
      }
    } else if (meetingData.meeting_status === 'recording' || meetingData.status === 'recording') {
      // Check if heartbeat is recent (within 5 minutes)
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      
      if (lastHeartbeat && lastHeartbeat > fiveMinutesAgo) {
        overallStatus = 'in_meeting' // Assume recording = in meeting
        isActiveMeeting = true
      } else {
        overallStatus = 'recorder_unavailable' // Stale heartbeat
        isActiveMeeting = false
      }
    }
    
    return {
      // Overall status and identification
      status: overallStatus,
      botId: meetingData.bot_id || 'unknown',
      timestamp: new Date().toISOString(),
      
      // Core bot states (simplified from DynamoDB data)
      core: {
        isBotRunning: isActiveMeeting,
        isBotPaused: overallStatus === 'paused', // Can determine from DB now
        hasJoined: overallStatus === 'in_meeting' || overallStatus === 'paused', // Only true if actually in meeting
        isClosing: false, // Can't determine from DB
        isFinalizing: false // Can't determine from DB
      },
      
      // Current meeting information
      meeting: {
        meetingId: meetingId,
        isActiveMeeting: isActiveMeeting,
        currentSpeaker: null, // Not available in DB
        meetingSpeakers: [], // Not available in DB
        speakerCount: 0, // Not available in DB
        startedAt: meetingData.started_at,
        endedAt: meetingData.ended_at,
        lastHeartbeat: meetingData.last_heartbeat,
        recordingStatus: meetingData.meeting_status || meetingData.status
      }
    }
  } catch (error) {
    console.error('❌ Error getting meeting status from DynamoDB:', error)
    return null
  }
}

// ✅ Function to Get Count of Active Recording Instances
async function getActiveInstanceCount() {
  try {
    let activeCount = 0
    let totalRecordings = 0

    // Try querying status_index GSI first for both recording and paused meetings
    try {
      // Query for recording meetings
      const recordingResult = await dynamoDB.query({
        TableName: DYNAMODB_RECORDINGS_TABLE,
        IndexName: 'status_index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status' // 'status' is a reserved keyword in DynamoDB
        },
        ExpressionAttributeValues: {
          ':status': 'recording',
        },
        ProjectionExpression: 'meeting_id, bot_id, last_heartbeat',
      }).promise()

      // Query for paused meetings
      const pausedResult = await dynamoDB.query({
        TableName: DYNAMODB_RECORDINGS_TABLE,
        IndexName: 'status_index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'paused',
        },
        ProjectionExpression: 'meeting_id, bot_id, last_heartbeat',
      }).promise()

      // Query for waiting_to_join meetings
      const waitingResult = await dynamoDB.query({
        TableName: DYNAMODB_RECORDINGS_TABLE,
        IndexName: 'status_index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'waiting_to_join',
        },
        ProjectionExpression: 'meeting_id, bot_id, last_heartbeat',
      }).promise()

      // Combine all results
      const allActiveItems = [
        ...(recordingResult.Items || []),
        ...(pausedResult.Items || []),
        ...(waitingResult.Items || [])
      ]

      if (allActiveItems.length > 0) {
        // Filter out stale recordings (older than 5 minutes without heartbeat)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const activeInstances = allActiveItems.filter(item => 
          item.last_heartbeat && item.last_heartbeat > fiveMinutesAgo
        )
        activeCount = activeInstances.length
      }

      // Now get total recordings (including completed ones) by scanning the main table
      try {
        const totalResult = await dynamoDB.scan({
          TableName: DYNAMODB_RECORDINGS_TABLE,
          FilterExpression: 'attribute_exists(meeting_status)',
          ProjectionExpression: 'meeting_id, meeting_status',
        }).promise()

        totalRecordings = totalResult.Items?.length || 0
      } catch (totalScanError) {
        console.error('❌ [Scheduler] Error scanning for total recordings:', totalScanError)
        totalRecordings = 0
      }

      return {
        activeCount: activeCount,
        totalRecordings: totalRecordings
      }

    } catch (gsiError) {
      // For now, return conservative estimates to avoid permissions issues
      // TODO: Implement GSI or alternative counting method
      return {
        activeCount: 0,
        totalRecordings: 0,
        error: 'GSI unavailable',
        message: 'status_index GSI not found - cannot determine accurate counts without Scan permissions'
      }
    }
  } catch (error) {
    console.error('❌ [Scheduler] Error getting active instance count:', error)
    return { activeCount: 0, totalRecordings: 0 }
  }
}

// ✅ Get bot status from DynamoDB (lightweight approach)
// This endpoint now queries DynamoDB directly instead of communicating with active bot instances
// Benefits: ~80% reduction in resource usage, faster response times, no RabbitMQ overhead
// Trade-offs: Less real-time granular status (no current speaker, detailed bot states)
// 
// Use ?debug=true query parameter to force direct bot communication for detailed debugging
// 
// To re-enable direct bot communication by default:
// 1. Uncomment the RabbitMQ calls below (search for "🚫 COMMENTED OUT")
// 2. Replace getMeetingStatusFromDynamoDB() call with sendStatusCommand()
// 3. Update communicationMethod from 'dynamodb' to 'rabbitmq'
app.get('/bot-status', async (req, res) => {
  try {
    const meetingId = req.query.meeting_id
    
    // Require meeting_id parameter
    if (!meetingId) {
      const instanceStats = await getActiveInstanceCount()
      let ecsDetails = null
      
      try {
        ecsDetails = await getCurrentECSTaskCount(ENVIRONMENT)
      } catch (ecsError) {
        console.error('⚠️ Failed to get ECS details:', ecsError.message)
        ecsDetails = {
          error: 'Unable to fetch ECS details',
          message: ecsError.message
        }
      }
      
      return res.status(400).json({
        error: 'Missing meeting_id parameter',
        message: 'meeting_id query parameter is required for status requests',
        timestamp: new Date().toISOString(),
        scheduler: {
          status: 'healthy',
          environment: ENVIRONMENT,
          timestamp: new Date().toISOString(),
          communicationMethod: 'dynamodb'
        },
        instances: {
          active: instanceStats.activeCount,
          total: instanceStats.totalRecordings,
          maxConcurrentPerInstance: 1,
          maxInstancesConfigured: ENVIRONMENT === 'production' ? 2 : 
                                 ENVIRONMENT === 'staging' ? 2 : 0,
          source: 'scheduler'
        },
        ecs: ecsDetails
      })
    }
    
    // Check if debug mode is requested (for detailed bot communication)
    const debugMode = req.query.debug === 'true'
    
    let botStatus
    if (debugMode) {
      // 🔧 DEBUG MODE: Use direct bot communication for detailed status
      console.log(`🔍 [DEBUG MODE] Using direct bot communication for meeting ${meetingId}`)
      try {
        botStatus = await sendStatusCommand(meetingId)
      } catch (debugError) {
        console.log(`⚠️ [DEBUG MODE] Direct communication failed, falling back to DynamoDB`)
        botStatus = await getMeetingStatusFromDynamoDB(meetingId)
      }
    } else {
      // ✅ NORMAL MODE: Get status from DynamoDB directly (much faster, less resource intensive)
      botStatus = await getMeetingStatusFromDynamoDB(meetingId)
    }
    
    // Get active instance count and ECS details
    const instanceStats = await getActiveInstanceCount()
    let ecsDetails = null
    
    try {
      ecsDetails = await getCurrentECSTaskCount(ENVIRONMENT)
    } catch (ecsError) {
      console.error('⚠️ Failed to get ECS details:', ecsError.message)
      ecsDetails = {
        error: 'Unable to fetch ECS details',
        message: ecsError.message
      }
    }
    
    // If meeting not found in database
    if (!botStatus) {
      return res.status(404).json({
        error: 'Meeting not found',
        message: `No meeting with ID: ${meetingId}`,
        timestamp: new Date().toISOString(),
        scheduler: {
          status: 'healthy',
          environment: ENVIRONMENT,
          timestamp: new Date().toISOString(),
          requestedMeetingId: meetingId,
          communicationMethod: 'dynamodb'
        },
        instances: {
          active: instanceStats.activeCount,
          total: instanceStats.totalRecordings,
          maxConcurrentPerInstance: 1,
          maxInstancesConfigured: ENVIRONMENT === 'production' ? 2 : 
                                 ENVIRONMENT === 'staging' ? 2 : 0,
          source: 'scheduler'
        },
        ecs: ecsDetails
      })
    }
    
    // Add scheduler service information to the response
    const enhancedStatus = {
      ...botStatus,
      scheduler: {
        status: 'healthy',
        environment: ENVIRONMENT,
        timestamp: new Date().toISOString(),
        requestedMeetingId: meetingId,
        communicationMethod: debugMode ? 'rabbitmq-debug' : 'dynamodb'
      },
      // Add instance information if not already present
      instances: botStatus.instances || {
        active: instanceStats.activeCount,
        total: instanceStats.totalRecordings,
        maxConcurrentPerInstance: 1,
        maxInstancesConfigured: ENVIRONMENT === 'production' ? 2 : 
                               ENVIRONMENT === 'staging' ? 2 : 0,
        source: 'scheduler'
      },
      ecs: ecsDetails
    }
    
    // Handle recorder_unavailable status (stale heartbeat)
    if (botStatus.status === 'recorder_unavailable') {
      return res.status(500).json({
        ...enhancedStatus,
        error: 'Bot recorder is unavailable',
        message: 'The meeting bot is not responding (stale heartbeat)'
      })
    }
    
    res.json(enhancedStatus)
    
    // 🚫 COMMENTED OUT: Direct RabbitMQ communication (resource-intensive approach)
    // const botStatus = await sendStatusCommand(meetingId)
    // if (botStatus.error === 'Meeting not found') {
    //   return res.status(404).json(enhancedStatus)
    // }
  } catch (error) {
    console.error(`[${ENVIRONMENT}] ❌ Error getting bot status from DynamoDB:`, error)
    
    // Return generic error response for DynamoDB failures
    const instanceStats = await getActiveInstanceCount()
    const errorResponse = {
      status: 'service_unavailable',
      timestamp: new Date().toISOString(),
      scheduler: {
        status: 'healthy',
        environment: ENVIRONMENT,
        timestamp: new Date().toISOString(),
        requestedMeetingId: req.query.meeting_id || null,
        communicationMethod: 'dynamodb'
      },
      instances: {
        active: instanceStats.activeCount,
        total: instanceStats.totalRecordings,
        maxConcurrentPerInstance: 1,
        maxInstancesConfigured: ENVIRONMENT === 'production' ? 2 : 
                               ENVIRONMENT === 'staging' ? 2 : 0,
        source: 'scheduler-error'
      },
      error: 'Could not get status from database',
      message: error.message || 'Database service is currently unavailable'
    }
    
    res.status(500).json(errorResponse)
    
    // 🚫 COMMENTED OUT: Old RabbitMQ-based fallback logic
    // const meetingId = req.query.meeting_id
    // if (meetingId) {
    //   console.log(`🔍 Checking DynamoDB fallback for meeting ${meetingId}`)
    //   const meetingInfo = await checkMeetingCompletion(meetingId)
    //   // ... rest of old fallback logic
    // }
  }
})

// Get all recordings from DynamoDB with active count
// 
// This endpoint returns all recordings from the DynamoDB table along with:
// - Total count of all recordings
// - Active count (currently active meetings only, not completed recordings)
// - Breakdown of different status types
// - Individual recording details with computed status and flags
//
// Active recordings are defined as:
// - active_count: Currently active meetings (in_meeting, paused, waiting_to_join with recent heartbeat)
// - completed_count: Completed recordings with files available (status = 'completed')
// - in_meeting_count: Currently recording with recent heartbeat (status = 'recording' + heartbeat < 5min)
//
// Usage: GET /recordings
// Response includes summary statistics and detailed recording list sorted by start time
app.get('/recordings', async (req, res) => {
  try {
    const scanResult = await dynamoDB.scan({
      TableName: DYNAMODB_RECORDINGS_TABLE,
      ProjectionExpression: 'meeting_id, bot_id, #status, meeting_status, started_at, ended_at, last_heartbeat, joined_at, organization_id, user_id, summary, start_time, end_time, meeting_url, transcription_generated',
      ExpressionAttributeNames: {
        '#status': 'status' // 'status' is a reserved keyword in DynamoDB
      }
    }).promise()

    const allRecordings = scanResult.Items || []
    
    // Calculate active count (recordings with has_recording or in_meeting status)
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    
    let activeCount = 0
    let completedCount = 0
    let inMeetingCount = 0
    
    const processedRecordings = allRecordings.map(recording => {
      const lastHeartbeat = recording.last_heartbeat ? new Date(recording.last_heartbeat) : null
      let currentStatus = 'unknown'
      let isActive = false
      
      // Determine current status and if it's active
      if (recording.meeting_status === 'completed' || recording.status === 'completed') {
        currentStatus = 'completed'
        completedCount++
      } else if (recording.meeting_status === 'not_admitted' || recording.status === 'not_admitted') {
        currentStatus = 'not_admitted'
        completedCount++ // Count as completed since it's a final state
      } else if (recording.meeting_status === 'recording' || recording.status === 'recording') {
        // Check if heartbeat is recent (within 5 minutes)
        if (lastHeartbeat && lastHeartbeat > fiveMinutesAgo) {
          currentStatus = 'in_meeting'
          isActive = true
          inMeetingCount++
        } else {
          currentStatus = 'stale_recording'
        }
      } else if (recording.meeting_status === 'paused' || recording.status === 'paused') {
        if (lastHeartbeat && lastHeartbeat > fiveMinutesAgo) {
          currentStatus = 'paused'
          isActive = true
        } else {
          currentStatus = 'stale_paused'
        }
      } else if (recording.meeting_status === 'waiting_to_join' || recording.status === 'waiting_to_join') {
        if (lastHeartbeat && lastHeartbeat > fiveMinutesAgo) {
          currentStatus = 'waiting_to_join'
          isActive = true
        } else {
          currentStatus = 'stale_waiting'
        }
      }
      
      // Count active recordings (only currently active meetings, not completed ones)
      if (isActive) {
        activeCount++
      }
      
      return {
        meeting_id: recording.meeting_id,
        bot_id: recording.bot_id,
        status: currentStatus,
        original_status: recording.status,
        meeting_status: recording.meeting_status,
        started_at: recording.started_at,
        ended_at: recording.ended_at,
        joined_at: recording.joined_at,
        last_heartbeat: recording.last_heartbeat,
        organization_id: recording.organization_id,
        user_id: recording.user_id,
        summary: recording.summary,
        start_time: recording.start_time,
        end_time: recording.end_time,
        meeting_url: recording.meeting_url,
        transcription_generated: recording.transcription_generated || false,
        is_active: isActive,
        heartbeat_age_minutes: lastHeartbeat ? Math.round((now - lastHeartbeat) / (1000 * 60)) : null
      }
    })
    
    // Sort recordings by started_at (most recent first)
    processedRecordings.sort((a, b) => {
      const aTime = new Date(a.started_at || 0)
      const bTime = new Date(b.started_at || 0)
      return bTime - aTime
    })
    
    // Get ECS details
    let ecsDetails = null
    try {
      ecsDetails = await getCurrentECSTaskCount(ENVIRONMENT)
    } catch (ecsError) {
      console.error('⚠️ Failed to get ECS details for recordings endpoint:', ecsError.message)
      ecsDetails = {
        error: 'Unable to fetch ECS details',
        message: ecsError.message
      }
    }
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total_recordings: allRecordings.length,
        active_count: activeCount,
        completed_count: completedCount,
        in_meeting_count: inMeetingCount,
        active_breakdown: {
          in_meeting: inMeetingCount,
          paused: processedRecordings.filter(r => r.status === 'paused').length,
          waiting_to_join: processedRecordings.filter(r => r.status === 'waiting_to_join').length
        }
      },
      recordings: processedRecordings,
      environment: ENVIRONMENT,
      table_name: DYNAMODB_RECORDINGS_TABLE,
      ecs: ecsDetails
    }
    
    res.json(response)
    
  } catch (error) {
    console.error('❌ [RECORDINGS] Error fetching recordings:', error)
    
    // Try to get ECS details even in error case for debugging
    let ecsDetails = null
    try {
      ecsDetails = await getCurrentECSTaskCount(ENVIRONMENT)
    } catch (ecsError) {
      ecsDetails = {
        error: 'Unable to fetch ECS details',
        message: ecsError.message
      }
    }
    
    res.status(500).json({
      error: 'Failed to fetch recordings',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: ENVIRONMENT,
      ecs: ecsDetails
    })
  }
})

const PORT = process.env.PORT || 80

initRabbitMQ().then(() => {
  setupStatusResponseListener() // Initialize the listener after RabbitMQ is ready
  
  // Setup scaling API routes
  setupScalingRoutes(app, getActiveInstanceCount)
  
  app.listen(PORT, () => {
    console.log(
      `Orchestrator service for ${ENVIRONMENT} running on port ${PORT}`,
    )
    console.log(`🔧 Scaling API endpoints available at /scale/*`)
  })
})
