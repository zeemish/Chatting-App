const { DataTypes } = require("sequelize");

const sequelize = require("../util/db");
const User = require("./user");

const Picture = sequelize.define(
  "picture",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
    },
  },
  { timestamps: false }
);

Picture.associate = (model) => {
  Picture.belongsTo(User, { onDelete: "CASCADE" });
};

module.exports = Picture;
