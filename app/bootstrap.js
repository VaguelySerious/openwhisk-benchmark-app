// This file is for running the nodejs action locally
// See "run.sh" for running it in openwhisk instead
process.env.IS_LOCAL=true
const fs = require('fs')
const handler = require('./index1').main

let tile = { z: 7, x: 234, y: 123 }
if (process.argv[2]) {
  const [z, x, y] = process.argv[2].split('/')
  tile = { z, x, y }
}

handler(tile, {})
  .then(({ params, body }) => {
    // fs.writeFileSync("out.png", body);
    // fs.writeFileSync('out.png', Buffer.from(body.image, 'base64'))
    delete body.image
    console.log(body)
    process.exit(0)
  })
  .catch(console.error)
