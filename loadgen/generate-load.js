process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const fs = require('fs')
const baseURL = 'https://localhost/api/v1/web/guest/default'
const actionName = '/tiles'

const grids = fs
  .readFileSync('sequence.txt', { encoding: 'utf8' })
  .split('\n\n')
  .map(grid => grid.split('\n'))
// .slice(12, 13)

// const data = {
//   config: {
//     target: baseURL,
//     phases: [{ duration: 1, arrivalRate: 1 }],
//     statsInterval: 1,
//   },
//   scenarios: [{ flow: [] }],
// }

// data.scenarios[0].flow = grids.map(grid => ({
//   parallel: grid.map(tile => ({ get: { url: actionName + '?' + tile } })),
// }))

// fs.writeFileSync('artillery.json', JSON.stringify(data), { encoding: 'utf8' })

const fetch = require('node-fetch')

async function get(tile) {
  try {
    const start = process.hrtime()
    console.time(tile)
    const res = await fetch(baseURL + actionName + '?' + tile).then(x =>
      x.json()
    )
    console.timeEnd(tile)
    res.logging.clientLat = process.hrtime(start)
    res.logging.tile = tile
    return res.logging
  } catch (e) {
    return {
      tile,
    }
  }
}

let ret = []
async function run() {
  const len = grids.length
  for (let i = 0; i < len; ++i) {
    const label = `Grid ${i + 1}/${len}`
    console.time(label)
    const results = await Promise.all(grids[i].map(get))
    for (let j = 0; j < results.length; ++j) {
      results[j].batch = i
    }
    ret = ret.concat(results)
    console.timeEnd(label)
  }
  for (let r of ret) {
    if (r.clientLat) {
      r.clientLat = r.clientLat[0] * 1000 + r.clientLat[1] / 1000000
    }
  }
  fs.writeFileSync('out.json', JSON.stringify(ret, null, 2))
}

run()
