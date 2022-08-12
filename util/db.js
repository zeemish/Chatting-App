require("dotenv").config();
const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    dialect: "mysql",
    host: "localhost",
  }
);

// arg1. db name
// arg2. db username
// arg3. db password
// dialect to tell that we are using mysql as db
// host: dont have to set it explicitly but a good practice

module.exports = sequelize;
