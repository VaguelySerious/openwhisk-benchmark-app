const fs = require('fs')

const vmId = Math.floor(
  Date.now() / 1000 -
    fs.readFileSync('/proc/uptime').toString().split(' ')[0].split('.')[0]
)
  .toString(32)
  .toUpperCase()

const osType = process.platform
const nodeVersion = process.version
const containerStartTime = Date.now()
const containerId = (containerStartTime + Math.floor(Math.random() * 10000000))
  .toString(32)
  .toUpperCase()

let startTime
let tcpTime
let tcpEndTime
let cacheHit = false
module.exports.vmId = vmId
module.exports.startFetch = () => {
  var hrTime = process.hrtime()
  tcpTime = hrTime[0] * 1000000 + hrTime[1] / 1000
}
module.exports.endFetch = () => {
  var hrTime = process.hrtime()
  tcpEndTime = hrTime[0] * 1000000 + hrTime[1] / 1000
}
module.exports.start = () => {
  startTime = Date.now()
}
module.exports.registerHit = (bool) => {
  cacheHit = bool
}
module.exports.end = (params) => {
  const executionEndTime = Date.now()
  return {
    params,
    container: process.env.HOSTNAME,
    containerStartTime,
    executionStartTime: startTime,
    executionEndTime,
    executionLat: executionEndTime - startTime,
    downloadLat: ((tcpEndTime - tcpTime) / 1000).toFixed(3),
    cacheHit,
    containerId,
    vmId,
    osType,
    nodeVersion,
  }
}
