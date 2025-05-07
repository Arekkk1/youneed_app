'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmailCode extends Model {
    static associate(models) {
      EmailCode.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'User',
      });
    }
  }

  EmailCode.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // Ensure this matches your users table name
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Cascade delete if user is deleted
      },
      email: { // Store the email the code was sent to for reference
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      code: {
        type: DataTypes.STRING(6), // Store the 6-digit code (plaintext for now)
        allowNull: false,
      },
      verified: {
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
      modelName: 'emailcode',
      tableName: 'emailcodes', // Explicit table name
      timestamps: true, // Sequelize handles createdAt and updatedAt
    }
  );

  return EmailCode;
};
