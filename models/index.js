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
const SupplierProduct = require('./supplierproduct')(sequelize);

//User and Customer Survey
User.hasMany(CustomerSurvey, { foreignKey: 'username', sourceKey: 'username' });
CustomerSurvey.belongsTo(User, { foreignKey: 'username', targetKey: 'username' });

// User and SupplierProduct
User.hasMany(SupplierProduct, { foreignKey: 'username', sourceKey: 'username' });
SupplierProduct.belongsTo(User, { foreignKey: 'username', targetKey: 'username' });

// Product and SupplierProduct
Product.hasMany(SupplierProduct, { foreignKey: 'productId', sourceKey: 'id' });
SupplierProduct.belongsTo(Product, { foreignKey: 'productId', targetKey: 'id' });

module.exports = {
  sequelize,
  User,
  Chat,
  Message,
  Product, 
  CustomerSurvey,
  SupplierProduct,
};