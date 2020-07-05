const fetch = require('node-fetch')
const { promisify } = require('util')
const Redis = require('redis')
require('redis-streams')(Redis)

const streams = require('./util/streams')
const transform = require('./util/transform')
const logging = require('./util/logging')

const redis = Redis.createClient({
  return_buffers: true,
  host: '35.159.28.28',
  auth_pass:
    '3f797c70216d0e548c34c2791537f304021ebc4b52bd486ac1b20d8b1f328085427422dabb8203f9610434dff4acd276097cd7f4cbd23f736eba53b55d712b6f',
  port: 6378,
})

const isInCache = promisify(redis.exists).bind(redis)

const baseUrl =
  'https://openwhisk-tiles.s3.eu-central-1.amazonaws.com/elevation'

async function main(params) {
  logging.start()
  const tileStream = await getTile(params).catch(() => null)
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
  console.log('- Getting', tileName)

  const exists = await isInCache(tileName)
  if (exists) {
    logging.registerHit(true)
    logging.startFetch()
    return redis.readStream(tileName)
  }

  const url = `${baseUrl}/${tileName}`
  logging.registerHit(false)
  logging.startFetch()
  const res = await fetch(url)
  if (res.status !== 200) {
    throw new Error('Can not get tile')
  }

  return res.body.pipe(redis.writeThrough(tileName))
}

exports.main = main
