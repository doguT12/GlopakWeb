// models/supplierproduct.js
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class SupplierProduct extends Model {}

  SupplierProduct.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Users', // Name of the Users table
        key: 'username',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Products', // Name of the Products table
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    delivery_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    price_per_unit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    quality: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 10,
      },
    },
  }, {
    sequelize,
    modelName: 'SupplierProduct',
    timestamps: true, // Adds createdAt and updatedAt fields
  });

  return SupplierProduct;
};