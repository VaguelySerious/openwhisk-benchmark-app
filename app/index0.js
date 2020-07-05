const fetch = require('node-fetch')

const streams = require('./util/streams')
const transform = require('./util/transform')
const logging = require('./util/logging')

const baseUrl =
  'https://openwhisk-tiles.s3.eu-central-1.amazonaws.com/elevation'

async function main(params) {
  logging.start()
  const tileStream = await getTile(params).catch(console.error)
  logging.endFetch()

  if (!tileStream) {
    const ret = {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        logging: logging.end(params),
      },
    }
    ret.body.logging.empty = true
    return ret
  }

  const pngSettings = {}

  const resultBuffer = await streams.pngStreamTransform(
    tileStream,
    pngSettings,
    transform.colorByHeight
  )

  const image = resultBuffer.toString('base64')
  const ret = {
    statusCode: 200,
  }

  if (params.binary === 'true') {
    ret.headers = { 'Content-Type': 'image/png' }
    ret.body = image
  } else {
    ret.headers = { 'Content-Type': 'application/json' }
    ret.body = {
      // image: resultBuffer.toString('base64'),
      logging: logging.end(params),
    }
  }

  return ret
}

async function getTile({ z, x, y }) {
  const tileName = `${z}/${x}/${y}.png`

  const url = `${baseUrl}/${tileName}`
  logging.registerHit(false)
  logging.startFetch()
  const res = await fetch(url)
  if (res.status !== 200) {
    throw new Error(`${res.status} at ${url}`)
  }

  return res.body
}

exports.main = main
