const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Correct path to db.js

const User = sequelize.define('User', {
  // Model attributes are defined here
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    // allowNull defaults to true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  // Add other attributes as needed
}, {
  // Other model options go here
  timestamps: true, // Example option
});

module.exports = User;
