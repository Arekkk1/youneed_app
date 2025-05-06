'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const OpeningHour = sequelize.define('OpeningHour', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    providerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    dayOfWeek: {
      type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
      allowNull: false
    },
    isOpen: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    openTime: {
      type: DataTypes.TIME,
      allowNull: true
    },
    closeTime: {
      type: DataTypes.TIME,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'OpeningHour',
    tableName: 'openinghours',
    timestamps: false
  });

  OpeningHour.associate = function(models) {
    OpeningHour.belongsTo(models.User, {
      foreignKey: 'providerId',
      as: 'Provider'
    });
  };

  return OpeningHour;
};