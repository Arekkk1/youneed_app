const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ModelName extends Model {
    static associate(models) {
      // Define associations here
    }
  }

  ModelName.init(
    {
      // Define attributes here
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      // ... other fields
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'ModelName',
      tableName: 'table_name',
      timestamps: true,
    }
  );

  return ModelName;
};
