module.exports = (sequelize, DataTypes) => {
     const Subscription = sequelize.define('Subscription', {
       id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true,
       },
       userId: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
           model: 'users',
           key: 'id',
         },
       },
       status: {
         type: DataTypes.ENUM('active', 'inactive', 'cancelled', 'pending_payment'),
         allowNull: false,
       },
       planName: {
         type: DataTypes.STRING(255),
         allowNull: false,
       },
       startDate: {
         type: DataTypes.DATE,
         allowNull: false,
       },
       endDate: {
         type: DataTypes.DATE,
         allowNull: true,
       },
       price: {
         type: DataTypes.DECIMAL(10, 2),
         allowNull: false,
       },
       paymentGatewayId: {
         type: DataTypes.STRING(255),
         allowNull: true,
       },
       createdAt: {
         type: DataTypes.DATE,
         allowNull: false,
       },
       updatedAt: {
         type: DataTypes.DATE,
         allowNull: false,
       },
     }, {
       tableName: 'subscriptions',
       timestamps: true,
     });

     Subscription.associate = models => {
       Subscription.belongsTo(models.User, {
         foreignKey: 'userId',
         as: 'User',
       });
     };

     return Subscription;
   };
