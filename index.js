const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const setup = (app, o) => {
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

  // what's the admin password (to create authorized session cookie)
  // this is used to access the rest-api as well as the Dashboard GUI
  // default password is 'test'
  process.env.SNT_ADMIN_HASH = (o.admin && typeof o.admin.hash === 'string')
    ? o.admin.hash : '$2a$10$Fs.gnowR98rmzKqqCkzNGePF2n5PCD0ZKHNYfzNsTjTcrBTVW4Aeu'
  // secret used to create JWT (json web token) used in auth session cookie
  process.env.SNT_JWT_SECRET = (o.admin && typeof o.admin.secret === 'string')
    ? o.admin.secret : 'o9gdlXwoFY5NPTzzeeuFXeF/ATUQvLHW8tquxv3pfE6nZaFsKdWvK'
  // internal file path to Dashboard GUI
  process.env.SNT_ADMIN_GUI = (o.admin && typeof o.admin.dashboard === 'string')
    ? o.admin.dashboard : path.join(__dirname, 'client')
  // served URL/path route to Dashboard GUI
  process.env.SNT_ADMIN_URL = (o.admin && typeof o.admin.route === 'string')
    ? o.admin.route : 'admin'
  // name of access token cookie
  process.env.SNT_TOKEN = (o.admin && typeof o.admin.token === 'string')
    ? o.admin.token : 'sntAdminToken'

  const utils = require('./js/utils.js')
  const clientLogger = require('./js/logger.js')
  const restAPI = require('./js/rest-api.js')

  utils.confirmDirs(process.env.SNT_DATA_PATH, () => {
    app.use(bodyParser.json())
    app.use(cookieParser())
    app.use(clientLogger)
    if (o.admin) app.use(restAPI)
    if (o.admin.dashboard !== 'string') {
      // serve default static directory for default dashboard
      // NOTE: maybe this should be served regardless???
      // ...so it can be used by custom dashbaord as well
      app.use(express.static(`${process.env.SNT_ADMIN_GUI}/static`))
    }
  })
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
