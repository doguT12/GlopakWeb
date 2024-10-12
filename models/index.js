const Sequelize = require('sequelize');

// Initialize Sequelize with the database connection
const sequelize = new Sequelize(process.env.DATABASE_URL || 'sqlite:./database.sqlite');

// Import models and pass the initialized `sequelize` instance
const User = require('./User')(sequelize);
const Chat = require('./Chat')(sequelize);
const Message = require('./Message')(sequelize);


module.exports = {
  sequelize,  
  User,
  Chat,
  Message
};