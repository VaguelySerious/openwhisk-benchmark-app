const fs = require('fs')
const baseURL = 'https://localhost/api/v1/web/guest/default'
const actionName = '/tiles'
const data = {
  config: {
    target: baseURL,
    phases: [{ duration: 1, arrivalRate: 1 }],
    statsInterval: 1,
  },
  scenarios: [{ flow: [] }],
}

const grids = fs
  .readFileSync('sequence.txt', { encoding: 'utf8' })
  .split('\n\n')
  .map(grid => grid.split('\n'))
  .slice(0, 1)

data.scenarios[0].flow = grids.map(grid => ({
  parallel: grid.map(tile => ({ get: { url: actionName + '?' + tile } })),
}))

fs.writeFileSync('artillery.json', JSON.stringify(data), { encoding: 'utf8' })
