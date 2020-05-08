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

const file = JSON.parse(fs.readFileSync('acc.txt', { encoding: 'utf8' }))

for (const type of ['no', 'tmp', 'loc', 'ext']) {
  console.log(`--------- ${type}-cache ----------`)
  for (const batch of [1, 2, 3]) {
    const items = file.filter((l) => l.type === type && +l.batch === batch)
    if (items.length === 0) {
      continue
    }
    console.log(`>> batch ${batch}:`)
    // console.log(items.map((x) => x.clientLatency))
    // continue

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
    // console.log('Container count', containerSorting)
    console.log('Container count', containerSorting.length)

    const vmCount = items.reduce((acc, a) => {
      acc[getId(a.vmId.toLowerCase())] =
        (acc[getId(a.vmId.toLowerCase())] || 0) + 1
      return acc
    }, {})
    console.log(vmCount)

    const translat = (latStr) => Number(latStr.slice(0, -2))
    const avgLat =
      items
        .slice(1)
        .reduce(
          (acc, a) => acc + translat(a.clientLatency),
          translat(items[0].clientLatency)
        ) / items.length
    console.log('Avg latency', +avgLat.toFixed(0))

    if (type !== 'no') {
      const cached = items.filter((i) => i.cacheHit === true)
      console.log(
        'Cachehits',
        ((100 * cached.length) / items.length).toFixed(0) + '%'
      )
      const avgDownLat =
        cached
          .slice(1)
          .reduce((acc, a) => acc + a.downloadLat, cached[0].downloadLat) /
        cached.length
      console.log('Avg cache latency', +avgDownLat.toFixed(0))

      const cTop90 = cached
        .sort((a, b) => a.downloadLat - b.downloadLat)
        .slice(0, Math.ceil(cached.length * 0.9))
      const p90DownLat =
        cTop90
          .slice(1)
          .reduce((acc, a) => acc + a.downloadLat, cTop90[0].downloadLat) /
        cTop90.length
      console.log('90th percentile cache latency', +p90DownLat.toFixed(0))
    }

    const notCached = items.filter((i) => i.cacheHit === false)
    const avgS3Lat =
      notCached
        .slice(1)
        .reduce((acc, a) => acc + a.downloadLat, notCached[0].downloadLat) /
      notCached.length
    console.log('Avg s3 latency', +avgS3Lat.toFixed(0))
  }
}
