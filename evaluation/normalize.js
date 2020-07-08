const fs = require('fs')

let all = []

for (const type of ['ext', 'loc', 'no', 'tmp']) {
  for (const batch in [0, 1, 2, 3, 4]) {
    // for (const solution of ['no']) {
    //   for (const num in [0]) {
    let file
	const name = `results/x_${type}_${batch}.txt`
    try {
      file = fs.readFileSync(name, {
        encoding: 'utf8',
      })
    } catch (e) {
      continue
    }
	console.log(name)

    const lines = file
      .split('\n')
      .filter(Boolean)
      .map((l) => l.split(' '))
      .map((sp) => ({
        type,
        batch,
        reqStartTimeH: sp[0],
        reqStartTime: Date.parse('2020-05-04T' + sp[0]),
        clientLatency: sp[1].slice(0, -2),
        ...(JSON.parse(sp[2]).logging || { error: true }),
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

const header = Object.keys(all[0]).join(',')
const body = all.map((o) => Object.values(o).join(',')).join('\n')

// console.log(JSON.stringify(all, null, 2))
fs.writeFileSync('acc.json', JSON.stringify(all, null, 2), { encoding: 'utf8' })
fs.writeFileSync('acc.csv', header + '\n' + body, { encoding: 'utf8' })
