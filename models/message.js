const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Message', {
    chat_username1: {
      type: DataTypes.STRING,
      allowNull: false
    },
    chat_username2: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sender_username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });
};