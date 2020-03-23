// This file is for running the nodejs action locally
// See "run.sh" for running it in openwhisk instead

const fs = require("fs");
const handler = require("./index").main;

process.env.isBootstrapped = true;
handler({ z: 3, x: 5, y: 3 }, {})
  .then(({ params, body }) => {
    // fs.writeFileSync("out.png", body);
    fs.writeFileSync("out.png", Buffer.from(body, "base64"));
    process.exit(0);
  })
  .catch(console.error);
