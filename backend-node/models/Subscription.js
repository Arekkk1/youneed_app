// Example: Create this file for subscription details
    module.exports = (sequelize, DataTypes) => {
      const Subscription = sequelize.define('Subscription', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        planName: DataTypes.STRING, // e.g., 'Basic', 'Premium'
        startDate: DataTypes.DATE,
        endDate: DataTypes.DATE,
        status: DataTypes.ENUM('active', 'inactive', 'cancelled', 'pending_payment'), // More detailed status
        price: DataTypes.DECIMAL(10, 2),
        paymentGatewayId: DataTypes.STRING, // ID from payment provider (e.g., Stripe, PayU)
        userId: {
          type: DataTypes.INTEGER,
          references: { model: 'Users', key: 'id' },
          allowNull: false,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      });
    
      Subscription.associate = models => {
        Subscription.belongsTo(models.User, { foreignKey: 'userId' });
      };
    
      return Subscription;
    };
