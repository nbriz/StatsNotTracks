const path = require('path')
const fs = require('fs')
const Sequelize = require('sequelize')
const db = {}
const credz = [
  process.env.SNT_DB_NAME,
  process.env.SNT_DB_USER,
  process.env.SNT_DB_PASS
]

const sql = new Sequelize(...credz, {
  host: 'localhost',
  dialect: 'sqlite',
  storage: `${process.env.SNT_DATA_PATH}/${process.env.SNT_DB_NAME}.sqlite`,
  logging: false
})

fs.readdirSync(__dirname)
  .filter(file => file !== path.basename(__filename))
  .forEach(file => {
    const model = require(`./${file}`)(sql, Sequelize.DataTypes)
    db[model.name] = model
  })

Object.keys(db).forEach(model => { // sync/create tables
  db[model].sync()
})

db.sql = sql
db.Sequelize = Sequelize

module.exports = db
