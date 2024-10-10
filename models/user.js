const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    // Define model attributes
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Add other attributes as needed
  }, {
    // Model options
    timestamps: true, // Adds createdAt and updatedAt fields
  });

  return User;
};


