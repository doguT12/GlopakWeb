const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite', // Database file location
  logging: false, // Disable logging turn on if necessary
});

// Test db connection
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection to SQLite established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to database:', err);
  });

module.exports = sequelize;
