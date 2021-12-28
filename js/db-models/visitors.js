module.exports = (sequelize, DataTypes) => {
  const Visitors = sequelize.define('Visitors', {
    hash: DataTypes.STRING,
    device: DataTypes.STRING,
    model: DataTypes.STRING,
    client: DataTypes.STRING,
    os: DataTypes.STRING,
    language: DataTypes.STRING
  })

  return Visitors
}
