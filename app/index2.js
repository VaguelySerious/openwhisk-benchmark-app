const fetch = require('node-fetch')
const { promisify } = require('util')
const logging = require('./util/logging')
const streams = require('./util/streams')
const transform = require('./util/transform')
const Redis = require('redis')
require('redis-streams')(Redis)

const id = logging.vmId.toLowerCase()
console.error(`--- Host ID: ${id}`)

const ids = {
  '1fb2c08': '0',
  '1fb2c09': '0',
  '1fb2c32': '1',
  '1fb2c33': '1',
  '1fb2c6u': '2',
  '1fb2c6t': '2',
}

const host = `redis-${ids[id]}-node`
const port = 6379

console.error(`--- Host: ${host}:${port}`)

const redis = Redis.createClient({
  return_buffers: true,
  host,
  // auth_pass: process.env.IS_LOCAL ? '' : process.env.ACTIONCACHE_PASSWORD,
  port: 6379,
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
