const fs = require('fs')
const utils = require('./utils.js')

function dateStr (subOne) {
  const date = new Date()
  const yer = date.getFullYear()
  let mon = date.getMonth() + 1 // +1 means Jan === 01 instead of 00
  if (subOne) mon -= 1
  let day = date.getDate()
  mon = String(mon).length === 1 ? '0' + mon : mon
  day = String(day).length === 1 ? '0' + day : day
  return `${yer}-${mon}-${day}`
}

async function getData () {
  const hits = await utils.getHits(db)
  const visitors = await utils.getVisitors(db)
  const locations = await utils.getLocations(db)


  const data = data.visitors.reduce((a, x) => ({ ...a, [x.hash]: x }), {})
  data.locations.forEach(l => { data.dict[l.hash].geo = l })
  data.hits.forEach(h => {
    if (!data.dict[h.hash].hits) data.dict[h.hash].hits = []
    data.dict[h.hash].hits.push(h)
  })

}

function createBackups () {
  const
  const fp = `${process.env.SNT_DATA_PATH}/backups/${dateStr()}.json`
  fs.stat(fp, (err, stat) => {
    if (err) {

    }
  })
  try {
    file = fs.readFileSync()
  } catch (err) {
    file = await createSaltFile()
  }
}
