const fetch = require('node-fetch')
const { promisify } = require('util')
const Redis = require('redis')
require('redis-streams')(Redis)

const streams = require('./util/streams')
const transform = require('./util/transform')
const logging = require('./util/logging')

const redis = Redis.createClient({
  return_buffers: true,
  host: process.env.IS_LOCAL ? '127.0.0.1' : 'actioncache',
  auth_pass: process.env.IS_LOCAL ? '' : process.env.ACTIONCACHE_PASSWORD,
  port: 6379,
})

const isInCache = promisify(redis.exists).bind(redis)

const baseUrl =
  'https://openwhisk-tiles.s3.eu-central-1.amazonaws.com/elevation'

async function main(params, injectedRedis) {
  logging.start()
  const tileStream = await getTile(params).catch(() => null)

  if (!tileStream) {
    const ret = {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        logging: logging.end(),
      },
    }
    ret.body.logging.empty = true
  }

  const pngSettings = {
    // colorType: 0, // grayscale
    // bitDepth: 16
    // inputHasAlpha: false,
  }

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
      image: resultBuffer.toString('base64'),
      logging: logging.end(),
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
