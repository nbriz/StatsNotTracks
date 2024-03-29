const fs = require('fs')
const path = require('path')
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const device = require('device')
const bcrypt = require('bcryptjs')
const utils = require('./utils.js')
const db = require('./db-models')

router.use(bodyParser.json())

function combineLibs (sntp) {
  const ioPath = path.dirname(require.resolve('socket.io'))
  const siop = path.join(ioPath, '../client-dist/socket.io.js')
  const snt = fs.readFileSync(sntp, 'utf8')
  const sio = fs.readFileSync(siop, 'utf8')
  const lib = sio + '\n' + snt
  return lib
}

router.get('/stats-not-tracks.js', async (req, res) => {
  const sntp = path.join(__dirname, '../client/stats-not-tracks.js')
  if (process.env.SNT_LIVE_STATS) res.send(combineLibs(sntp))
  else res.sendFile(sntp)
})

router.get('/stats-not-tracks.min.js', async (req, res) => {
  const sntp = path.join(__dirname, '../client/stats-not-tracks.min.js')
  if (process.env.SNT_LIVE_STATS) res.send(combineLibs(sntp))
  else res.sendFile(sntp)
})

router.post('/snt-api/hit', async (req, res) => {
  if (process.env.SNT_DEBUG) console.log('HIT', req.originalUrl)

  const dev = device(req.headers['user-agent'], { parseUserAgent: true })
  const software = dev.parser.useragent
  const app2str = (d) => `${d.family}.${d.major}.${d.minor}.${d.patch}`

  // let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  let ip = req.connection.remoteAddress
  ip = ip.includes('ffff:') ? ip.split('ffff:')[1] : ip
  ip = (ip === '127.0.0.1' && req.headers['x-real-ip']) ? req.headers['x-real-ip'] : ip
  const uniqueVisitor = ip + req.headers['user-agent']
  const saltfile = await utils.getSalt()
  const uvHash = await bcrypt.hash(uniqueVisitor, saltfile.salt)

  const hit = {
    hash: uvHash,
    timestamp: Date.now(),
    action: req.body.action,
    referrer: req.body.referrer,
    host: req.body.host,
    path: req.body.path,
    payload: JSON.stringify(req.body.payload)
  }

  utils.logHit(db, hit, {
    hash: uvHash,
    device: dev.type,
    model: dev.model,
    client: app2str(software),
    os: app2str(software.os),
    language: req.headers['accept-language']
  })

  utils.logGeo(db, ip, uvHash)

  res.send('roger.roger')
})

module.exports = router
