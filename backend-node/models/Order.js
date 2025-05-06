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
         allowNull: true,
         references: {
           model: 'users', // Małe litery
           key: 'id',
         },
       },
       serviceId: {
         type: DataTypes.INTEGER,
         allowNull: true,
         references: {
           model: 'services', // Małe litery
           key: 'id',
         },
       },
       status: {
         type: DataTypes.STRING,
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
       tableName: 'orders', // Małe litery
       timestamps: true,
     });

     Order.associate = models => {
       Order.belongsTo(models.User, {
         as: 'Client',
         foreignKey: 'clientId',
         onDelete: 'SET NULL',
         onUpdate: 'CASCADE',
         constraintName: 'fk_order_client', // Unikalna nazwa klucza obcego
       });
       Order.belongsTo(models.User, {
         as: 'Provider',
         foreignKey: 'providerId',
         onDelete: 'NO ACTION', // Zmieniono dla zgodności z zapytaniem
         onUpdate: 'CASCADE',
         constraintName: 'fk_order_provider', // Unikalna nazwa klucza obcego
       });
       Order.belongsTo(models.Service, {
         as: 'Service',
         foreignKey: 'serviceId',
         onDelete: 'SET NULL',
         onUpdate: 'CASCADE',
         constraintName: 'fk_order_service', // Unikalna nazwa klucza obcego
       });
     };

     return Order;
   };
