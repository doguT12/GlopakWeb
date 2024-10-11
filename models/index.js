const Sequelize = require('sequelize');

// Initialize Sequelize with the database connection (adjust as necessary for SQLite)
const sequelize = new Sequelize(process.env.DATABASE_URL || 'sqlite:./database.sqlite');

// Import models and pass the initialized `sequelize` instance
const User = require('./User')(sequelize);
const Chat = require('./Chat')(sequelize);
const Message = require('./Message')(sequelize);

// If relationships are necessary, they should be defined here (based on usernames, you may not need foreign keys)

module.exports = {
  sequelize,  // Export the initialized `sequelize` instance
  User,
  Chat,
  Message
};