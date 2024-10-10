const Sequelize = require('sequelize');
const sequelize = require('../app').sequelize; // Import sequelize instance

// Define the User model
const User = sequelize.define('User', {
  username: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

module.exports = User;