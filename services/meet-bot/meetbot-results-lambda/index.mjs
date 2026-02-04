import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.SQS_ENDPOINT,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.S3_ENDPOINT,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  forcePathStyle: process.env.S3_ENDPOINT?.includes('localstack') || false,
})
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL

const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })

export async function handler(event) {
  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))
      const parts = key.split('/')
      const meetingId = parts[1] || 'UNKNOWN'

      const getObjectParams = { Bucket: bucket, Key: key }
      const command = new GetObjectCommand(getObjectParams)
      const response = await s3Client.send(command)
      const transcriptionContent = await streamToString(response.Body)

      const contentSize = Buffer.byteLength(transcriptionContent, 'utf8')
      if (contentSize > 256 * 1024) {
        // 256 KB SQS limit
        console.error(
          `Transcription file is too large (${contentSize} bytes) to send via SQS`,
        )
        continue
      }

      const messageBody = JSON.stringify({
        meeting_id: meetingId,
        bucket: bucket,
        key: key,
        transcription: transcriptionContent,
      })

      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: SQS_QUEUE_URL,
          MessageBody: messageBody,
        }),
      )
      console.log(`Sent meeting results message for meeting_id = ${meetingId}`)
    }
    return { statusCode: 200, body: 'OK' }
  } catch (error) {
    console.error('Error processing meeting results:', error)
    throw error
  }
}
