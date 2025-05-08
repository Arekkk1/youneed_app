// backend-node/models/Order.js
module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users', // Małe litery
        key: 'id',
      },
    },
    providerId: {
      type: DataTypes.INTEGER,
      allowNull: false, // Zmieniono na false, aby pasowało do schematu bazy danych (NOT NULL)
      references: {
        model: 'users', // Małe litery
        key: 'id',
      },
    },
    serviceId: {
      type: DataTypes.INTEGER.UNSIGNED, // Zmieniono na INTEGER.UNSIGNED, aby pasowało do schematu bazy danych
      allowNull: true,
      references: {
        model: 'services', // Małe litery
        key: 'id',
      },
    },
    title: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    startAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    endAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled', 'active'),
      allowNull: true,
    },
    // createdAt i updatedAt będą zarządzane przez Sequelize dzięki timestamps: true
  }, {
    tableName: 'orders', // Małe litery
    timestamps: true, // Sequelize doda createdAt i updatedAt
  });

  Order.associate = models => {
    Order.belongsTo(models.User, {
      as: 'Client',
      foreignKey: 'clientId',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    Order.belongsTo(models.User, {
      as: 'Provider',
      foreignKey: 'providerId',
      onDelete: 'NO ACTION', // Zgodnie z tym, że providerId jest NOT NULL, usuwanie Usera nie powinno ustawiać providerId na NULL
      onUpdate: 'CASCADE',
    });
    Order.belongsTo(models.Service, {
      as: 'Service',
      foreignKey: 'serviceId',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    Order.hasOne(models.Feedback, {
        foreignKey: 'orderId',
        as: 'Feedback'
    });
  };

  return Order;
};
