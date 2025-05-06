module.exports = (sequelize, DataTypes) => {
     const Favorite = sequelize.define('Favorite', {
       id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true,
       },
       clientId: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
           model: 'users', // Małe litery
           key: 'id',
         },
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
       tableName: 'favorites', // Małe litery
       timestamps: true,
     });

     Favorite.associate = models => {
       Favorite.belongsTo(models.User, {
         as: 'Client',
         foreignKey: 'clientId',
         onDelete: 'NO ACTION',
         onUpdate: 'CASCADE',
         constraintName: 'fk_favorite_client', // Unikalna nazwa klucza obcego
       });
       Favorite.belongsTo(models.User, {
         as: 'Provider',
         foreignKey: 'providerId',
         onDelete: 'NO ACTION',
         onUpdate: 'CASCADE',
         constraintName: 'fk_favorite_provider', // Unikalna nazwa klucza obcego
       });
     };

     return Favorite;
   };
