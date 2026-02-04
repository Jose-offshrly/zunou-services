require('dotenv').config()
const axios = require('axios')
const AWS = require('aws-sdk')
const { google } = require('googleapis')
const express = require('express')
const bodyParser = require('body-parser')
const { getAccessToken } = require('./auth0Client')

const AWS_REGION = process.env.AWS_REGION
const CORE_GRAPHQL_URL = process.env.CORE_GRAPHQL_URL
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE
const ENVIRONMENT = process.env.ENVIRONMENT
const PORT = process.env.PORT || 80
const SCHEDULER_URL = process.env.SCHEDULER_URL
const USER_EMAIL = process.env.USER_EMAIL
const WEBHOOK_URL = process.env.WEBHOOK_URL

const secretsManager = new AWS.SecretsManager({ region: AWS_REGION })
const dynamoDB = new AWS.DynamoDB.DocumentClient({ region: AWS_REGION })

const app = express()
app.use(bodyParser.json())

async function getGoogleCredentials() {
  const secret = await secretsManager
    .getSecretValue({ SecretId: process.env.SECRET_NAME })
    .promise()
  return JSON.parse(secret.SecretString)
}

async function validateEmails(attendees) {
  const token = await getAccessToken()

  const response = await fetch(CORE_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
              query ValidateEmails($emails: [String!]!) {
                  validateEmails(emails: $emails) {
                      email
                      userId
                      organizationIds
                  }
              }
          `,
      variables: { emails: attendees },
    }),
  })

  const data = await response.json()
  return data.data.validateEmails || null
}

app.get('/', (req, res) => {
  res.status(200).json({ status: 'healthy' })
})

app.post('/notifications', async (req, res) => {
  console.log('📅 Received Google Calendar Notification')
  const resourceUri = req.headers['x-goog-resource-uri']
  const resourceState = req.headers['x-goog-resource-state']
  console.log('🔗 Resource URI:', resourceUri)
  console.log('🔄 Resource State:', resourceState)

  if (!resourceUri) {
    console.log('⚠ No resource URI found in headers')
    return res.sendStatus(400)
  }

  try {
    const credentials = await getGoogleCredentials()
    const jwtClient = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/calendar'],
      USER_EMAIL,
    )
    await jwtClient.authorize()
    const calendar = google.calendar({ version: 'v3', auth: jwtClient })

    const now = new Date()
    const timeMin = new Date(now.getTime() - 60 * 60 * 1000).toISOString() // 1 hour ago

    const eventsResponse = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      singleEvents: true,
      orderBy: 'startTime',
      conferenceDataVersion: 1,
      maxResults: 20,
    })

    if (!eventsResponse.data || !eventsResponse.data.items) {
      console.error('❌ Google API response is incomplete:', eventsResponse)
      return res.sendStatus(500)
    }

    const events = eventsResponse.data.items
    if (!events || events.length === 0) {
      console.log('No upcoming events found.')
      return res.sendStatus(200)
    }

    console.log('📅 Processing events...')
    for (const event of events) {
      if (!event.status) {
        console.warn(`⚠ Event ${event.id} is missing 'status'. Skipping.`)
        continue
      }

      if (event.status === 'cancelled') {
        console.log(`🛑 Event ${event.id} was cancelled. Skipping.`)
        continue
      }

      if (event.status !== 'confirmed') {
        console.warn(
          `⚠ Event ${event.id} has unexpected status: '${event.status}'. Skipping.`,
        )
        continue
      }

      if (!event.start || (!event.start.dateTime && !event.start.date)) {
        console.warn(
          `⚠ Event ${event.id} is missing valid 'start' data. Skipping.`,
        )
        continue
      }

      const start = event.start.dateTime || event.start.date
      const end = event.end?.dateTime || event.end?.date
      const summary = event.summary || 'No Title'
      const organizerEmail = event.organizer?.email || 'unknown@unknown.com'

      // ✅ Atomic Lock: Prevent race conditions
      try {
        await dynamoDB
          .put({
            TableName: DYNAMODB_TABLE,
            Item: {
              meeting_id: event.id,
              status: 'processing', // Temporary lock
              processed_at: new Date().toISOString(),
            },
            ConditionExpression: 'attribute_not_exists(meeting_id)',
          })
          .promise()
        console.log(`🔒 Locked event ${event.id} for processing.`)
      } catch (err) {
        if (err.code === 'ConditionalCheckFailedException') {
          console.log(
            `⚠ Event ${event.id} is already being processed. Skipping.`,
          )
          continue
        } else {
          console.error(
            `❌ Error inserting lock for event ${event.id}:`,
            err.message,
          )
          continue
        }
      }

      console.log(`📌 Processing event: ${event.id} - ${summary}`)
      let orgUser = null
      // ✅ Validate Attendees (unless running on DEV)
      if (ENVIRONMENT !== 'development') {
        const attendees =
          event.attendees?.map((attendee) => attendee.email) || []
        const validUsers = await validateEmails([...attendees, organizerEmail])

        if (!validUsers || validUsers.length === 0) {
          console.log(
            `❌ No valid Pulse users for meeting ${event.id}. Skipping.`,
          )
          continue
        }
        orgUser = validUsers[0]

        // TODO: create a meeting record in the db on the PULSE side to join our meeting_id to this user & organization
        // Pulse can then recognize this when the transcript is uploaded to the SQS queue
      } else {
        // create some dummy data for orgUser on dev
        orgUser = {
          organizationIds: ['9ba1267e-8cd5-4f9b-80b5-0c5c21f71f95'],
          userId: '9ba12680-71ec-4de5-946a-7f1389385334',
        }
      }

      // ✅ Check for Google Meet link
      let meetEntry = null
      if (event.conferenceData && event.conferenceData.entryPoints) {
        meetEntry = event.conferenceData.entryPoints.find(
          (entry) => entry.entryPointType === 'video',
        )
      }

      if (!meetEntry) {
        console.log(
          `⚠ No Google Meet link found for event ${event.id}, skipping scheduler.`,
        )
        continue
      }

      console.log(
        `✅ Ready to schedule: ${event.id} - Google Meet Link: ${meetEntry.uri}`,
      )

      // ✅ Trigger the scheduler before marking as processed
      try {
        const response = await axios.post(SCHEDULER_URL, {
          id: event.id,
          startTime: start,
          meetingUrl: meetEntry.uri,
          summary,
        })

        console.log('🚀 Orchestrator successfully triggered:', response.data)
      } catch (err) {
        console.error('❌ Failed to trigger orchestrator:', err.message)
        continue
      }

      // ✅ Store in DynamoDB after successful scheduling
      try {
        await dynamoDB
          .update({
            TableName: DYNAMODB_TABLE,
            Key: { meeting_id: event.id },
            UpdateExpression:
              'SET #status = :status, organization_id = :orgId, user_id = :userId, summary = :summary, start_time = :start, end_time = :end, meeting_url = :url',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
              ':status': 'completed',
              ':orgId': orgUser.organizationIds[0],
              ':userId': orgUser.userId,
              ':summary': summary,
              ':start': start,
              ':end': end,
              ':url': meetEntry.uri,
            },
          })
          .promise()
        console.log(`✅ Event ${event.id} marked as completed.`)
      } catch (err) {
        console.error(
          `❌ Failed to update event ${event.id} in DynamoDB:`,
          err.message,
        )
      }
    }
  } catch (error) {
    console.error('❌ Failed to fetch event details:', error.stack)
  }
  res.sendStatus(200)
})

// ✅ `watchCalendar` with autorenew
async function watchCalendar() {
  const credentials = await getGoogleCredentials()
  const jwtClient = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/calendar'],
    USER_EMAIL,
  )
  await jwtClient.authorize()

  const calendar = google.calendar({ version: 'v3', auth: jwtClient })
  const watchResponse = await calendar.events.watch({
    calendarId: 'primary',
    requestBody: {
      id: `pulse-bot-channel-${Date.now()}`,
      type: 'web_hook',
      address: WEBHOOK_URL,
    },
  })

  console.log('📡 Google Calendar watch started.')

  // Re-subscribe before expiration
  if (watchResponse?.data?.expiration) {
    const expiration = parseInt(watchResponse.data.expiration, 10)
    const oneMinuteBuffer = 60 * 1000
    const renewalDelay = expiration - Date.now() - oneMinuteBuffer

    setTimeout(async () => {
      console.log('⌛ Renewing Google Calendar watch...')
      try {
        await watchCalendar()
      } catch (err) {
        console.error('❌ Failed to renew watch:', err)
      }
    }, renewalDelay)
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`)
  try {
    await watchCalendar()
  } catch (error) {
    console.error('❌ Failed to start calendar watch:', error)
  }
})
