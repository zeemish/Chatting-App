const { DataTypes, Model } = require("sequelize");

const sequelize = require("../util/db");
const Location = require("./location");
const Picture = require("./picture");

const User = sequelize.define(
  "user",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
    },
    identity: {
      type: DataTypes.STRING,
    },
    interest: {
      type: DataTypes.STRING,
    },
    age: {
      type: DataTypes.STRING,
    },
    relationPreference: {
      type: DataTypes.STRING,
    },
    favDrink: {
      type: DataTypes.STRING,
    },
    favSong: {
      type: DataTypes.STRING,
    },
    hobbies: {
      type: DataTypes.STRING,
    },
    petPeeve: {
      type: DataTypes.STRING,
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      required: true,
    },
  },
  { timestamps: false }
);

User.associate = (model) => {
  User.hasOne(Picture, {
    onDelete: "CASCADE",
  });
};
User.associate = (model) => {
  User.belongsTo(Location, {
    onDelete: "CASCADE",
  });
};

module.exports = User;
