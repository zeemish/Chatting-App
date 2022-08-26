const { DataTypes } = require("sequelize");

const sequelize = require("../util/db");

const PricePlan = sequelize.define(
  "price_plan",
  {
    stripePriceId: {
      type: DataTypes.STRING,
    },
    title: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.STRING,
    },
    stripeProductId: {
      type: DataTypes.STRING,
    },
    price: {
      type: DataTypes.STRING,
    },
  },
  { timestamps: false }
);

module.exports = PricePlan;
