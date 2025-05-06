module.exports = (sequelize, DataTypes) => {
      const Order = sequelize.define('Order', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        title: DataTypes.STRING,
        description: DataTypes.TEXT,
        startAt: DataTypes.DATE,
        endAt: DataTypes.DATE,
        status: DataTypes.ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled'),
        // rating: DataTypes.INTEGER, // Removed - rating should be in Feedback model
        clientId: {
          type: DataTypes.INTEGER,
          references: { model: 'Users', key: 'id' },
          allowNull: true, // Allow orders created by provider without immediate client assignment
        },
        providerId: {
          type: DataTypes.INTEGER,
          references: { model: 'Users', key: 'id' },
          allowNull: false,
        },
        serviceId: {
          type: DataTypes.INTEGER,
          references: { model: 'Services', key: 'id' },
          allowNull: false,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      });
    
      Order.associate = models => {
        Order.belongsTo(models.User, { as: 'Client', foreignKey: 'clientId' });
        Order.belongsTo(models.User, { as: 'Provider', foreignKey: 'providerId' });
        Order.belongsTo(models.Service, { foreignKey: 'serviceId' });
        Order.hasOne(models.Feedback, { foreignKey: 'orderId' }); // An order can have one feedback
      };
    
      return Order;
    };
