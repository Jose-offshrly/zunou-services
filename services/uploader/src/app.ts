import * as companion from '@uppy/companion'
import bodyParser from 'body-parser'
import express from 'express'
import session from 'express-session'
import os from 'os'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const developmentVersion = 'unknown'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const productionVersion = '1.16.0'

const stagingVersion = '34.0.0-staging.3'

const version = stagingVersion

const companionUrl = new URL(process.env.COMPANION_URL!)
const port = companionUrl.port ? parseInt(companionUrl.port, 10) : 80

const app = express()

app.use(bodyParser.json())
app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.COMPANION_SESSION_SECRET!,
  }),
)

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  next()
})

app.get('/', (_req, res) => {
  res
    .status(200)
    .setHeader('Content-Type', 'application/json')
    .send(`{"version":"${version}"}`)
})

const companionOptions = {
  debug: true,
  filePath: os.tmpdir(),
  providerOptions: {
    drive: {
      key: process.env.COMPANION_GOOGLE_CLOUD_CLIENT_ID,
      secret: process.env.COMPANION_GOOGLE_CLOUD_CLIENT_SECRET,
    },
    onedrive: {
      key: process.env.COMPANION_ONEDRIVE_KEY,
      secret: process.env.COMPANION_ONEDRIVE_SECRET,
    },
  },
  secret: 'secret',
  server: {
    host: companionUrl.host,
    path: '/companion',
    protocol: companionUrl.protocol.replace(/:$/, ''),
  },
  uploadUrls: process.env.COMPANION_UPLOAD_URLS?.split(','),
}

const { app: companionApp } = companion.app(companionOptions)
app.use('/companion', companionApp)

// Handle 404.
app.use((_req, res) => {
  return res.status(404).json({ message: 'Not Found' })
})

companion.socket(
  app.listen(port, '0.0.0.0', () => {
    console.log(`⚡️ Uploader app is listening on http://0.0.0.0:${port}`)
  }),
)
