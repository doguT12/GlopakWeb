const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Chat', {
    user1_username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    user2_username: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });
};