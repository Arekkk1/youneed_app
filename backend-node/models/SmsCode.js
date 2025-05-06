'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SmsCode extends Model {
    static associate(models) {
      SmsCode.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'User', // Keep the alias if used elsewhere, otherwise optional
      });
    }
  }

  SmsCode.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: { // This field was already defined and caused the error
        type: DataTypes.INTEGER,
        allowNull: false, // Keep as false, logic should always provide it
        references: {
          model: 'users', // Ensure this matches your users table name
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // Or 'CASCADE' depending on desired behavior
      },
      phoneNumber: { // --- ADDED FIELD ---
        type: DataTypes.STRING, // Assuming phone numbers are stored as strings
        allowNull: true, // Or false if every code must have a phone number explicitly stored
      },
      code: {
        type: DataTypes.STRING(6),
        allowNull: false,
      },
      verified: { // --- ADDED FIELD (based on route logic) ---
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'SmsCode',
      tableName: 'smscodes', // Ensure this matches your table name
      timestamps: true, // Sequelize handles createdAt and updatedAt
    }
  );

  return SmsCode;
};
