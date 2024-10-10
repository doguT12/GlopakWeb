const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

// Import models
const User = require('./user')(sequelize);

// Add other models here and initialize them similarly
// const Post = require('./post')(sequelize);
// const Comment = require('./comment')(sequelize);

// Define associations if any
// Example:
// User.hasMany(Post);
// Post.belongsTo(User);

module.exports = {
  sequelize,
  User,
  // Export other models here
};

