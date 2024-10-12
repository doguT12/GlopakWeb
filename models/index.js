const Sequelize = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
});

const User = require('./user')(sequelize);
const Chat = require('./chat')(sequelize);
const Message = require('./message')(sequelize);
const Product = require('./product')(sequelize); 

module.exports = {
  sequelize,
  User,
  Chat,
  Message,
  Product, 
};