const { DataTypes, Model } = require("sequelize");

const sequelize = require("../util/db");
const Picture = require("./picture");
const User = require("./user");

const Location = sequelize.define(
  "location",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    location: {
      type: DataTypes.STRING,
    },
  },
  { timestamps: false }
);

Location.associate = (model) => {
  Location.hasMany(User, {
    onDelete: "CASCADE",
  });
};

module.exports = Location;
