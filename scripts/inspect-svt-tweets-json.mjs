import { readFileSync } from 'node:fs'

const raw = readFileSync('scripts/svt_tweets.json', 'utf8')
const arr = JSON.parse(raw)
console.log(`entries: ${arr.length}`)
console.log('keys:', Object.keys(arr[0]))
console.log('\nsample entry:')
console.log(JSON.stringify(arr[0], null, 2))
