module.exports = (sequelize, DataTypes) => {
  const Locations = sequelize.define('Locations', {
    hash: DataTypes.STRING,
    status: DataTypes.STRING,
    message: DataTypes.STRING,
    country: DataTypes.STRING,
    countryCode: DataTypes.STRING,
    region: DataTypes.STRING,
    regionName: DataTypes.STRING,
    city: DataTypes.STRING,
    zip: DataTypes.STRING,
    isp: DataTypes.STRING,
    org: DataTypes.STRING,
    as: DataTypes.STRING,
    mobile: DataTypes.STRING,
    proxy: DataTypes.STRING,
    hosting: DataTypes.STRING
  })

  return Locations
}
