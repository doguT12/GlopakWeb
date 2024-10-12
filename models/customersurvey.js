
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CustomerSurvey extends Model {}

  CustomerSurvey.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'username',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    speed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 10,
      },
    },
    cost: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 10,
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
    modelName: 'CustomerSurvey',
    timestamps: true,
  });

  return CustomerSurvey;
};