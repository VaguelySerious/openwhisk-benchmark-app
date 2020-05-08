const fs = require('fs')

let all = []

for (const type of ['ext', 'loc', 'no', 'tmp']) {
  for (const batch in [0, 1, 2, 3, 4]) {
    // for (const solution of ['no']) {
    //   for (const num in [0]) {
    let file
    try {
      file = fs.readFileSync(`results/ex_${type}cache_${batch}.txt`, {
        encoding: 'utf8',
      })
    } catch (e) {
      continue
    }

    const lines = file
      .split('\n')
      .filter(Boolean)
      .map((l) => l.split(' '))
      .map((sp) => ({
        reqStartTime: sp[0],
        clientLatency: sp[1],
        ...(JSON.parse(sp[2]).logging || { error: true }),
        batch,
        type,
      }))
      .filter((obj) => !obj.error)
      .map((o) => {
        o.tile = `${o.params.z}/${o.params.x}/${o.params.y}`
        delete o.params
        delete o.osType
        delete o.nodeVersion
        return o
      })
    console.log(lines.length)
    all = all.concat(lines)
  }
}

// console.log(JSON.stringify(all, null, 2))
fs.writeFileSync('acc.txt', JSON.stringify(all, null, 2), { encoding: 'utf8' })
