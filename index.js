const fetch = require("node-fetch");
const { promisify } = require("util");
const Redis = require("redis");
require("redis-streams")(Redis);

const streams = require("./util/streams");
const transform = require("./util/transform");
const logging = require("./util/logging");

const redis = Redis.createClient({
  return_buffers: true,
  host: process.env.IS_LOCAL ? "127.0.0.1" : "actioncache",
  auth_pass: process.env.IS_LOCAL ? "" : process.env.ACTIONCACHE_PASSWORD,
  port: 6379
});

const isInCache = promisify(redis.exists).bind(redis);

const baseUrl =
  "https://openwhisk-tiles.s3.eu-central-1.amazonaws.com/elevation";

async function main(params, injectedRedis) {
  logging.start();
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

  const ret = {
    statusCode: 200,
    headers: { "Content-Type": "image/png" },
    params,
    body: {
      image: resultBuffer.toString("base64"),
      logging: logging.end()
    }
  };
  return ret;
}

async function getTile({ z, x, y }) {
  const tileName = `${z}/${x}/${y}.png`;
  console.log("- Getting", tileName);

  const exists = await isInCache(tileName);
  if (exists) {
    logging.registerHit(true);
    logging.startFetch();
    return redis.readStream(tileName);
  }

  logging.registerHit(false);
  const url = `${baseUrl}/${tileName}`;
  logging.startFetch();
  const res = await fetch(url);

  return res.body.pipe(redis.writeThrough(tileName));
  return res.body;
}

exports.main = main;
