module.exports = (sequelize, DataTypes) => {
     const Equipment = sequelize.define('Equipment', {
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
       quantity: {
         type: DataTypes.INTEGER,
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
       tableName: 'equipment', // Małe litery
       timestamps: true,
     });

     Equipment.associate = models => {
       Equipment.belongsTo(models.User, {
         as: 'Provider',
         foreignKey: 'providerId',
         onDelete: 'NO ACTION',
         onUpdate: 'CASCADE',
         constraintName: 'fk_equipment_provider', // Unikalna nazwa klucza obcego
       });
     };

     return Equipment;
   };
