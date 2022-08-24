const { DataTypes, Model } = require("sequelize");

const sequelize = require("../util/db");
const Location = require("./location");
const Picture = require("./picture");

const User_QrCode = sequelize.define(
  "user_qrcode",
  {
    qrId: {
      type: DataTypes.INTEGER,
    },
    userID: {
      type: DataTypes.INTEGER,
    },
  },
  { timestamps: false }
);

module.exports = User_QrCode;
