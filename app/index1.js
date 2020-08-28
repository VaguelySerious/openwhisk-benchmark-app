const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')
const ReadableStreamClone = require('readable-stream-clone')

const streams = require('./util/streams')
const transform = require('./util/transform')
const logging = require('./util/logging')
const { execSync } = require('child_process')

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
    const imgBuffer = resultBuffer.toString('base64')
    ret.headers = { 'Content-Type': 'application/json' }
    ret.body = {
      logging: logging.end(params),
    }
  }

  return ret
}

async function getTile({ z, x, y }) {
  const tileName = `${z}/${x}/${y}.png`
  const localName = '/tmp/' + tileName.replace(/\//g, '-')

  const exists = fs.existsSync(localName)
  if (exists) {
    logging.registerHit(true)
    logging.startFetch()
    return fs.createReadStream(localName)
  }

  const url = `${baseUrl}/${tileName}`
  logging.registerHit(false)
  logging.startFetch()
  const res = await fetch(url)
  if (res.status !== 200) {
    throw new Error('Can not get tile')
  }

  const readStream1 = new ReadableStreamClone(res.body)
  const readStream2 = new ReadableStreamClone(res.body)

  console.log('wha')
  readStream1.pipe(fs.createWriteStream(localName))
  return readStream2
}

exports.main = main
