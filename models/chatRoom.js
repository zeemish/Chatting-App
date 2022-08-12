const { DataTypes } = require("sequelize");

const sequelize = require("../util/db");
const User = require("./user");

const ChatRoom = sequelize.define(
  "chatRoom",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    senderId: {
      type: DataTypes.STRING,
    },
    receiverId: {
      type: DataTypes.STRING,
    },
    message: {
      type: DataTypes.STRING,
    },
    type: {
      type: DataTypes.STRING,
    },
    mediaURL: {
      type: DataTypes.STRING,
    },
  },
  { timestamps: true }
);

module.exports = ChatRoom;
