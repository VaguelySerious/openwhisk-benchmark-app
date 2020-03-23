const fetch = require("node-fetch");
const streams = require("./util/streams");
const transform = require("./util/transform");
const { promisify } = require("util");
const Redis = require("redis");
require("redis-streams")(Redis);

const redis = Redis.createClient({
  return_buffers: true,
  host: process.env.isBootstrapped ? "127.0.0.1" : "actioncache",
  port: 6379
});

const isInCache = promisify(redis.exists).bind(redis);
const auth = promisify(redis.auth).bind(redis);

const baseUrl =
  "https://openwhisk-tiles.s3.eu-central-1.amazonaws.com/elevation";

async function main(params, injectedRedis) {
  const password = process.env.ACTIONCACHE_PASSWORD;
  if (password) {
    await auth(password);
  }

  const tileStream = await getTile(params);

  // TODO Prevent it from scaling down to 8bit grayscale from 16bit
  const pngSettings = {
    colorType: 0 // grayscale
  };

  const resultBuffer = await streams.pngStreamTransform(
    tileStream,
    pngSettings,
    transform.colorByHeight
  );

  return {
    params,
    body: resultBuffer.toString("base64"),
    headers: { "Content-Type": "image/png" },
    statusCode: 200
  };
}

async function getTile({ z, x, y }) {
  const tileName = `${z}/${x}/${y}.png`;
  console.log("- Getting", tileName);

  const exists = await isInCache(tileName);
  if (exists) {
    console.log("- Cache hit");
    return redis.readStream(tileName);
  }

  console.log("- Cache miss");
  const url = `${baseUrl}/${tileName}`;
  const res = await fetch(url);

  return res.body.pipe(redis.writeThrough(tileName));
}

exports.main = main;
