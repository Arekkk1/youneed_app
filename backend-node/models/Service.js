module.exports = (sequelize, DataTypes) => {
     const Service = sequelize.define('Service', {
       id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true,
       },
       name: {
         type: DataTypes.STRING,
         allowNull: true,
       },
       description: {
         type: DataTypes.TEXT,
         allowNull: true,
       },
       price: {
         type: DataTypes.DECIMAL(10, 2),
         allowNull: true,
       },
       duration: {
         type: DataTypes.INTEGER,
         allowNull: true,
       },
       category: {
         type: DataTypes.STRING,
         allowNull: true,
       },
       providerId: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
           model: 'users', // Małe litery
           key: 'id',
         },
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
       tableName: 'services', // Małe litery
       timestamps: true,
     });

     Service.associate = models => {
       Service.belongsTo(models.User, {
         as: 'Provider',
         foreignKey: 'providerId',
         onDelete: 'NO ACTION',
         onUpdate: 'CASCADE',
         constraintName: 'fk_service_provider', // Unikalna nazwa klucza obcego
       });
     };

     return Service;
   };
