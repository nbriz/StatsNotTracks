const path = require('path')
const express = require('express')
const setup = (app, o) => {
  o = o || {}

  if (o.debug) process.env.SNT_DEBUG = true

  // where are we storing the data?
  process.env.SNT_DATA_PATH = (typeof o.path === 'string')
    ? o.path : `${path.dirname(require.main.filename)}/SNT_DATA`

  // sqlite database credentials
  process.env.SNT_DB_NAME = process.env.SNT_DB_NAME || 'snt_analytics'
  process.env.SNT_DB_USER = process.env.SNT_DB_USER || 'snt_admin'
  process.env.SNT_DB_PASS = process.env.SNT_DB_PASS || 'snt_password'

  // how long should we keep a unique visitor ID/hash before changing it?
  process.env.SNT_ID_TTL = (typeof o.idttl === 'number')
    ? o.idttl : 1000 * 60 * 60 * 24 // 1 day

  // served URL/path route to Dashboard GUI
  process.env.SNT_ADMIN_URL = (o.admin && typeof o.admin.route === 'string')
    ? o.admin.route : 'stats-not-tracks'
  // internal file path to Dashboard GUI
  process.env.SNT_ADMIN_GUI = (o.admin && typeof o.admin.dashboard === 'string')
    ? o.admin.dashboard : path.join(__dirname, 'client')
  // name of access token cookie
  process.env.SNT_TOKEN = (o.admin && typeof o.admin.token === 'string')
    ? o.admin.token : 'sntAdminToken'
  // the ttl (time to live) of the cookie (default is 1 day)
  process.env.SNT_JWT_COOKIE_TTL = (o.admin && typeof o.admin.ttl === 'number')
    ? o.admin.ttl : 24 * 60 * 60 * 1000
  // secret used to create JWT (json web token) used in auth session cookie
  process.env.SNT_JWT_SECRET = (o.admin && typeof o.admin.secret === 'string')
    ? o.admin.secret : 'o9gdlXwoFY5NPTzzeeuFXeF/ATUQvLHW8tquxv3pfE6nZaFsKdWvK'
  // what's the admin password (to create authorized session cookie)
  // this is used to access the rest-api as well as the Dashboard GUI
  // default password is 'test'
  process.env.SNT_ADMIN_HASH = (o.admin && typeof o.admin.hash === 'string')
    ? o.admin.hash : (o.admin.token || o.admin.secret)
      ? '$2a$10$Fs.gnowR98rmzKqqCkzNGePF2n5PCD0ZKHNYfzNsTjTcrBTVW4Aeu' : null

  const utils = require('./js/utils.js')
  utils.confirmDirs(process.env.SNT_DATA_PATH)

  const clientLogger = require('./js/logger.js')
  app.use(clientLogger)

  if (o.admin) {
    app.use(express.static(`${path.join(__dirname, 'client')}/static`))
    const restAPI = require('./js/rest-api.js')
    app.use(restAPI)
  }
}

const live = (server, io) => {
  io = (io && io.httpServer) ? io : require('socket.io')(server)
  process.env.SNT_LIVE_STATS = true
  io.on('connection', (socket) => {
    io.emit('snt-connection', io.sockets.sockets.size)
    socket.on('disconnect', () => {
      io.emit('snt-connection', io.sockets.sockets.size)
    })
  })
}

module.exports = { setup, live }
