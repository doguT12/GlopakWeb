const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Ensures usernames are unique
      validate: {
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    role: {
      type: DataTypes.ENUM('customer', 'supplier'),
      allowNull: false,
      defaultValue: 'customer', // Sets default role
    },
  }, {
    timestamps: true, // Adds createdAt and updatedAt fields
  });

  return User;
};


