const PNG = require("pngjs").PNG;
const logging = require("./logging");

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("error", err => {
      reject(err);
    });
    stream.on("data", chunk => {
      chunks.push(chunk);
    });
    stream.once("end", () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

function pngStreamTransform(inStream, pngSettings, transform) {
  return new Promise((resolve, reject) => {
    inStream.pipe(new PNG(pngSettings)).on("parsed", function() {
      logging.endFetch();
      transform.call(this);
      streamToBuffer(this.pack())
        .then(resolve)
        .catch(reject);
    });
  });
}

module.exports = {
  pngStreamTransform,
  streamToBuffer
};
