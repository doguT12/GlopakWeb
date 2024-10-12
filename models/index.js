const Sequelize = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
});

const User = require('./user')(sequelize);
const Chat = require('./chat')(sequelize);
const Message = require('./message')(sequelize);
const Product = require('./product')(sequelize); 
const CustomerSurvey = require('./customersurvey')(sequelize);

User.hasMany(CustomerSurvey, { foreignKey: 'username', sourceKey: 'username' });
CustomerSurvey.belongsTo(User, { foreignKey: 'username', targetKey: 'username' });

module.exports = {
  sequelize,
  User,
  Chat,
  Message,
  Product, 
  CustomerSurvey,
};