const fs = require('fs')
const os = require('os')

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash += Math.pow(str.charCodeAt(i) * 31, str.length - i)
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}

//detect vm id based on either boot time or mac-address+hostname (should be VM unique in azure)
var vmId = process.platform
if (vmId == 'win32' || vmId == 'win64') {
  vmId = process.env['COMPUTERNAME']
} else {
  vmId = Math.floor(
    Date.now() / 1000 -
      fs
        .readFileSync('/proc/uptime')
        .toString()
        .split(' ')[0]
        .split('.')[0]
  )
    .toString(32)
    .toUpperCase()
}

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
module.exports.startFetch = () => {
  tcpTime = Date.now()
}
module.exports.endFetch = () => {
  tcpEndTime = Date.now()
}
module.exports.start = () => {
  startTime = Date.now()
}
module.exports.registerHit = bool => {
  cacheHit = bool
}
module.exports.end = result => {
  const executionEndTime = Date.now()
  return {
    containerStartTime,
    executionStartTime: startTime,
    executionEndTime,
    executionLat: executionEndTime - startTime,
    downloadLat: tcpEndTime - tcpTime,
    cacheHit,
    containerId,
    vmId,
    osType,
    nodeVersion,
  }
}
