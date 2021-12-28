const fs = require('fs')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const exec = require('child_process').exec

function confirmDirs (dir, callback) {
  const dirp = dir || process.env.SNT_DATA_PATH
  fs.stat(dirp, (err, stat) => {
    if (err) {
      fs.mkdirSync(dir)
      fs.mkdirSync(`${dir}/backups`)
    }
    callback()
  })
}

async function checkToken (req) {
  const token = req.cookies[process.env.SNT_TOKEN]
  if (!token) return { error: 'no access token' }

  const valid = await jwt.verify(token, process.env.SNT_JWT_SECRET)
  if (!valid) return { error: 'access token is invalid' }

  return { message: 'access granted' }
}

async function createToken (req) {
  const adminHash = process.env.SNT_ADMIN_HASH
  const valid = await bcrypt.compare(req.body.password, adminHash)

  if (!valid) return { error: 'password is incorrect' }

  const message = 'access granted'
  const userData = { data: req.body.password }
  const token = jwt.sign(userData, process.env.SNT_JWT_SECRET)
  const oneDay = 24 * 60 * 60 * 1000
  const options = {
    maxAge: oneDay, secure: true, sameSite: true, httpOnly: true
  }
  return { token, options, message }
}

async function createSaltFile () {
  const salt = await bcrypt.genSalt(10)
  const file = { date: Date.now(), salt }
  const saltPath = `${process.env.SNT_DATA_PATH}/salt.json`
  const strData = JSON.stringify(file)
  fs.writeFileSync(saltPath, strData)
  return strData
}

async function getSalt () {
  let file
  try {
    file = fs.readFileSync(`${process.env.SNT_DATA_PATH}/salt.json`)
  } catch (err) {
    file = await createSaltFile()
  }

  file = JSON.parse(file)
  const limit = file.date + process.env.SNT_ID_TTL
  if (limit < Date.now()) {
    file = await createSaltFile()
    file = JSON.parse(file)
  }

  return file
}

// ----- ~ ~ ~ ----- ~ ~ ~ ----- ~ ~ ~ ----- ~ ~ ~ ----- ~ ~ ~ ----- ~ ~ ~ -----
// ----- ~ ~ ~ ----- ~ ~ ~ ----- ~ ~ ~ ----- ~ ~ ~ ----- ~ ~ ~ ----- ~ ~ ~ -----
// DATABASE QUERY FUNCTIONS

async function getData (db, table, keys, opts) {
  if (opts.id) {
    try {
      const v = await db[table].findOne({ where: { id: opts.id } })
      return v
    } catch (err) { return { error: err } }
  } else if (opts) {
    try {
      const v = await db[table].findAll({ where: opts })
      return v
    } catch (err) { return { error: err } }
  } else {
    try {
      const v = await db[table].findAll({ attributes: keys })
      return v
    } catch (err) { return { error: err } }
  }
}

async function getVisitors (db, opts) {
  opts = opts || {}
  const keys = ['hash', 'device', 'model', 'client', 'os', 'language']
  return getData(db, 'Visitors', keys, opts)
}

async function getHits (db, opts) {
  opts = opts || {}
  const keys = ['hash', 'timestamp', 'action', 'referrer', 'host', 'path']
  return getData(db, 'Hits', keys, opts)
}

async function getLocations (db, opts) {
  opts = opts || {}
  const keys = ['hash', 'status', 'message', 'country', 'countryCode', 'region', 'regionName', 'city', 'zip', 'isp', 'org', 'as', 'mobile', 'proxy', 'hosting']
  return getData(db, 'Locations', keys, opts)
}

// ----- ~ ~ ~ ----- ~ ~ ~ ----- ~ ~ ~ -----

async function logHit (db, hit, visitor) {
  db.Hits.create(hit)
  // if this is a new userHash, create Visitors entry
  const v = await getVisitors(db, { hash: visitor.hash })
  if (v.length === 0) db.Visitors.create(visitor)
}

async function logGeo (db, ip, uvHash) {
  const g = await db.Locations.findOne({ where: { hash: uvHash } })
  const previouslyFailed = g && g.status === 'fail'
  if (!g || previouslyFailed) {
    const f = '?fields=status,message,country,countryCode,region,regionName,city,zip,isp,org,as,mobile,proxy,hosting,query'
    exec(`curl http://ip-api.com/json/${ip}${f}`, (err, stdout) => {
      if (err) {
        const f = { hash: uvHash, status: 'fail', message: 'curl failed' }
        db.Locations.create(f)
      } else {
        const data = JSON.parse(stdout)
        data.hash = uvHash
        db.Locations.create(data)
      }
    })
  }
}

module.exports = {
  confirmDirs,
  checkToken,
  createToken,
  getSalt,
  getVisitors,
  getLocations,
  getHits,
  logHit,
  logGeo
}