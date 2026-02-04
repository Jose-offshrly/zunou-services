const amqp = require('amqplib')
const {
  SchedulerClient,
  DeleteScheduleCommand,
} = require('@aws-sdk/client-scheduler')

const schedulerClient = new SchedulerClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.SCHEDULER_ENDPOINT,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})

const AMQP_URL = process.env.AMQP_URL
const EXCHANGE_NAME = 'meet-bot-exchange'

module.exports.handler = async (event) => {
  const meetUrl =
    event.meetingUrl || (event.meeting ? event.meeting.meetingUrl : null)
  const meetingId = event.meetingId || (event.meeting ? event.meeting.id : null)
  const companionName = event.companionName || (event.meeting ? event.meeting.companionName : null)
  const scheduleName = event.scheduleName
  const groupName = event.groupName

  if (!meetUrl || !meetingId) {
    console.error('❌ Missing required parameters: meetUrl or meetingId')
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Both meetUrl and meetingId are required',
      }),
    }
  }

  const message = {
    command: 'start',
    meetingId,
    meetUrl,
    companionName,
  }

  try {
    const conn = await amqp.connect(AMQP_URL)
    const channel = await conn.createChannel()
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true })

    channel.publish(
      EXCHANGE_NAME,
      'start.meeting',
      Buffer.from(JSON.stringify(message)),
      { persistent: true },
    )

    console.log(`✅ Published RabbitMQ START for meeting ${meetingId}`)

    await channel.close()
    await conn.close()
  } catch (error) {
    console.error('❌ Failed to send message to RabbitMQ:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to enqueue job',
        details: error.message,
      }),
    }
  }

  // ✅ Delete the EventBridge schedule after processing
  if (scheduleName && groupName) {
    try {
      await schedulerClient.send(
        new DeleteScheduleCommand({
          Name: scheduleName,
          GroupName: groupName,
        }),
      )
      console.log(
        `🗑️ Deleted schedule: ${scheduleName} from group: ${groupName}`,
      )
    } catch (error) {
      console.error(`❌ Failed to delete schedule: ${scheduleName}`, error)
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Job sent to RabbitMQ and schedule deleted',
      meeting_id: meetingId,
    }),
  }
}
