module.exports = (sequelize, DataTypes) => {
  const Hits = sequelize.define('Hits', {
    hash: DataTypes.STRING,
    timestamp: DataTypes.INTEGER,
    action: DataTypes.STRING,
    referrer: DataTypes.STRING,
    host: DataTypes.STRING,
    path: DataTypes.STRING,
    payload: DataTypes.STRING
  })

  return Hits
}
