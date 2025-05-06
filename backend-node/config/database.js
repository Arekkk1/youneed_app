require('dotenv').config();
const { Sequelize } = require('sequelize');

console.log({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT,
});

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT || 5432,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  dialectOptions: {
    charset: 'utf8mb4',
    ssl: {
      require: true,
      rejectUnauthorized: false, // Zmień na true, jeśli masz certyfikat CA
    },
    connectTimeout: 30000, // 30 sekund timeout
  },
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  retry: {
    match: [/ETIMEDOUT/, /EHOSTUNREACH/, /ECONNREFUSED/],
    max: 3, // Ponów próbę 3 razy
  },
});

module.exports = sequelize;
// const { Sequelize } = require('sequelize');

// const sequelize = new Sequelize('youneed_db', 'username', 'password', {
//   host: 'localhost',
//   dialect: 'mysql',
//   logging: false,
// });

// module.exports = sequelize;
