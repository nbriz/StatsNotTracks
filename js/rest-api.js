const express = require('express')
const router = express.Router()
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const utils = require('./utils.js')
const db = require('./db-models')
// const Op = db.Sequelize.Op

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
  const o = await utils.checkToken(req, res)
  if (o.error) res.sendFile(`${process.env.SNT_ADMIN_GUI}/login.html`)
  else res.sendFile(`${process.env.SNT_ADMIN_GUI}/dashboard.html`)
  // res.sendFile(`${process.env.SNT_ADMIN_GUI}/login.html`)
})

// ------------------------------------------------- GET ANALYTICS DATA---------
// ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~

router.get('/snt-api/data', async (req, res) => {
  const q = req.query
  const o = await utils.checkToken(req, res)
  if (o.error) return res.json(o)

  const data = {}
  const hashes = new Set()
  const hits = await utils.getHits(db)
  const visitors = await utils.getVisitors(db)
  const locations = await utils.getLocations(db)

  if (q.start && q.end) {
    const s = Number(q.start)
    const e = Number(q.end)
    data.hits = hits.filter(h => {
      if (h.timestamp <= e && h.timestamp >= s) {
        hashes.add(h.hash)
        return true
      } else return false
    })
  } else { data.hits = hits }

  data.visitors = visitors.filter(v => hashes.size > 0 && hashes.has(v.hash))
  data.locations = locations.filter(l => hashes.size > 0 && hashes.has(l.hash))

  return res.json(data)
})

module.exports = router
