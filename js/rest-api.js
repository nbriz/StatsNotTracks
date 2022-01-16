const express = require('express')
const router = express.Router()
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const utils = require('./utils.js')
const db = require('./db-models')
const Op = db.Sequelize.Op

router.use(bodyParser.json())
router.use(cookieParser())

// --------------------------------------------------------- LOGIN/OUT ---------
// ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~

router.post('/snt-api/login', async (req, res) => {
  if (!req.body.password) return res.json({ error: 'missing login data' })

  const auth = await utils.createToken(req)
  if (auth.error) return res.json(auth)

  res.cookie(process.env.SNT_TOKEN, auth.token, auth.options)
    .json({ message: auth.message })
})

router.post('/snt-api/logout', (req, res) => {
  res.cookie(process.env.SNT_TOKEN, '', { expires: new Date() }).json({
    message: 'logout successful'
  })
})

router.get(`/${process.env.SNT_ADMIN_URL}`, async (req, res) => {
  if (process.env.SNT_ADMIN_HASH !== 'null') {
    const o = await utils.checkToken(req, res)
    if (o.error) res.sendFile(`${process.env.SNT_ADMIN_GUI}/login.html`)
    else res.sendFile(`${process.env.SNT_ADMIN_GUI}/dashboard.html`)
  } else {
    res.sendFile(`${process.env.SNT_ADMIN_GUI}/dashboard.html`)
  }
})

// ------------------------------------------------- GET ANALYTICS DATA---------
// ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~
async function getHitsInDateRange (range, query) {
  const opts = {
    timestamp: { [Op.gt]: range.start || 0, [Op.lt]: range.end || Date.now() }
  }
  if (query.path) opts.path = query.path
  if (query.referrer) opts.referrer = query.referrer
  if (query.hash) opts.hash = query.hash

  const hits = await utils.getHits(db, opts)
  const hashes = Array.from(new Set(hits.map(hit => hit.hash)))
  return { hits, hashes }
}

async function getDataMatchingHashes (type, hashes) {
  const opts = { hash: { [Op.in]: hashes } }
  const data = type === 'hits'
    ? await utils.getHits(db, opts)
    : type === 'visitors'
      ? await utils.getVisitors(db, opts)
      : await utils.getLocations(db, opts)
  return data
}

function createOpts (q) {
  let opt
  if (Object.keys(q).length > 0) {
    opt = {}
    for (const key in q) {
      if (key === 'os') opt.os = { [Op.startsWith]: q[key] }
      else if (key === 'client') opt.client = { [Op.startsWith]: q[key] }
      else opt[key] = q[key]
    }
  }
  return opt
}

router.get('/snt-api/data/:type', async (req, res) => {
  const t = req.params.type
  const q = req.query

  if (process.env.SNT_ADMIN_HASH !== 'null') {
    const o = await utils.checkToken(req, res)
    if (o.error) return res.json(o)
  }

  const range = { start: Number(q.start), end: Number(q.end) }
  delete q.start
  delete q.end
  const opts = createOpts(q)

  const data = await getHitsInDateRange(range, q)
  if (t === 'hits') {
    data.visitors = await getDataMatchingHashes('visitors', data.hashes)
    data.locations = await getDataMatchingHashes('locations', data.hashes)
  } else if (t === 'visitors') {
    data.visitors = await utils.getVisitors(db, opts)
    const vhashes = data.visitors.map(v => v.hash)
    data.hits = data.hits.filter(hit => vhashes.includes(hit.hash))
    data.hashes = data.hashes.filter(h => vhashes.includes(h))
    data.locations = await getDataMatchingHashes('locations', data.hashes)
  } else if (t === 'locations') {
    data.locations = await utils.getLocations(db, opts)
    const lhashes = data.locations.map(l => l.hash)
    data.hits = data.hits.filter(hit => lhashes.includes(hit.hash))
    data.hashes = data.hashes.filter(h => lhashes.includes(h))
    data.visitors = await getDataMatchingHashes('visitors', data.hashes)
  }

  return res.json(data)
})

module.exports = router
