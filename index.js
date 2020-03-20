const fetch = require("node-fetch");
const streams = require("./util/streams");
const transform = require("./util/transform");

const baseUrl = "http://url-to-tile-server.com";
// "https://openwhisk-tiles.s3.eu-central-1.amazonaws.com/elevation";

async function main(params, redis) {
  const tileStream = await getTile(params);

  const pngSettings = {
    colorType: 0 // grayscale
  };

  const resultBuffer = await streams.pngStreamTransform(
    tileStream,
    pngSettings,
    transform.colorByHeight
  );

  return { params, body: resultBuffer.toString("base64") };
}

async function getTile({ z, x, y }) {
  const url = `${baseUrl}/${z}/${x}/${y}.png`;

  // const existing = await redis.get(tileName)
  // if (existing) {
  //   return existing
  // }

  console.log("Fetching", url.slice(baseUrl.length));
  // const tile = s3s.ReadStream(s3, bucket);
  const res = await fetch(url);
  return res.body;

  // redis.set(tileName, tile)
}

exports.main = main;
