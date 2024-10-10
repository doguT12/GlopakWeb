const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite', // Database file location
  logging: false, // Disable logging; default: console.log
});

// Test database connection
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection to SQLite has been established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = sequelize;
