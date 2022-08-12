const { DataTypes } = require("sequelize");

const sequelize = require("../util/db");

const QRCode = sequelize.define(
  "qr_code",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    qr_Code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  { timestamps: false }
);

module.exports = QRCode;
