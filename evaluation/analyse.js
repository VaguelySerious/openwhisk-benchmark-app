const fs = require('fs')

/*
  {
    "reqStartTime": "16:46:23",
    "clientLatency": "429ms",
    "cacheHit": false,
    "container": "wskowdev-invoker-00-916-default-tiles2",
    "containerId": "1E6F0VMRM",
    "containerStartTime": 1587487560158,
    "downloadLat": 140,
    "executionEndTime": 1587487583088,
    "executionLat": 192,
    "executionStartTime": 1587487582896,
    "vmId": "1F9TNNT",
    "batch": "1",
    "type": "loc",
    "tile": "4/3/4"
  },
*/

const ids = {
  '1f9to4m': 'a',
  '1f9to4n': 'a',
  '1f9tnnt': 'b',
  '1f9tnns': 'b',
  '1f9toe0': 'c',
  '1f9todv': 'c',
}

const ids2 = {
  '1fb2c08': '0',
  '1fb2c09': '0',
  '1fb2c32': '1',
  '1fb2c33': '1',
  '1fb2c6u': '2',
  '1fb2c6t': '2',
}

function getId(id) {
  // return id
  return ids2[id]
  return ids[id]
}

function percentile(arr, p) {
  const sorted = arr.sort((a, b) => a - b)

  const low = Math.floor(arr.length * p)
  const heigh = Math.ceil(arr.length * p)
  const perct = sorted.slice(low, heigh === low ? heigh + 1 : heigh)[0]

  return perct
}

const file = JSON.parse(fs.readFileSync('acc.json', { encoding: 'utf8' }))

const total = []

for (const [type, batch] of [
  // ['no', 0],
  ['no', 1],
  ['no', 2],
  // ['tmp', 0],
  ['tmp', 1],
  ['tmp', 2],
  ['tmp', 3],
  // ['loc', 0],
  ['loc', 1],
  // ['loc', 2],
  ['loc', 3],
  // ['ext', 0],
  ['ext', 1],
  ['ext', 2],
  ['ext', 3],
]) {
  const ret = {}
  const items = file.filter((l) => l.type === type && +l.batch === batch)
  // .filter((l) => Number(l.clientLatency.slice(0, -2)) < 500000)
  if (items.length === 0) {
    continue
  }

  total.push(ret)
  ret.type = type + '-cache'

  const containerFuncCount = items.reduce((acc, a) => {
    acc[a.containerId] = (acc[a.containerId] || 0) + 1
    return acc
  }, {})
  const containerSorting = Object.keys(containerFuncCount)
    .map((x) => ({
      id: x,
      count: containerFuncCount[x],
    }))
    .sort((a, b) => b.count - a.count)
  ret.containerCount = containerSorting.length

  const vmCount = items.reduce((acc, a) => {
    acc[getId(a.vmId.toLowerCase())] =
      (acc[getId(a.vmId.toLowerCase())] || 0) + 1
    return acc
  }, {})
  ret.vmUsageDistribution = Object.values(vmCount)
    .map((c) => (c / items.length).toFixed(2))
    .join('/')

  const clientsLats = items.map((i) => Number(i.clientLatency.slice(0, -2)))
  ret.avgClientLat = +(
    clientsLats.slice(1).reduce((acc, a) => acc + a, clientsLats[0]) /
    items.length
  ).toFixed(0)

  const notCached = items.filter((i) => i.cacheHit === false)
  const avgS3Lat =
    notCached
      .slice(1)
      .reduce((acc, a) => acc + a.downloadLat, notCached[0].downloadLat) /
    notCached.length
  ret.avgS3Lat = +avgS3Lat.toFixed(0)

  if (type !== 'no') {
    const cached = items.filter((i) => i.cacheHit === true)

    ret.cacheHitRatio = +(cached.length / items.length).toFixed(3)

    ret.avgCacheLat = +(
      cached
        .slice(1)
        .reduce((acc, a) => acc + a.downloadLat, cached[0].downloadLat) /
      cached.length
    ).toFixed(0)

    ret.p90 = percentile(
      cached.map((c) => c.downloadLat),
      0.9
    )
    ret.p99 = percentile(
      cached.map((c) => c.downloadLat),
      0.99
    )
  }
}

console.log(total)

const header = Object.keys(total[total.length - 1]).join(',')
const body = total.map((o) => Object.values(o).join(',')).join('\n')
fs.writeFileSync('results.csv', header + '\n' + body, { encoding: 'utf8' })
