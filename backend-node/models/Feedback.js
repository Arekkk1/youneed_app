module.exports = (sequelize, DataTypes) => {
     const Feedback = sequelize.define('Feedback', {
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
       rating: {
         type: DataTypes.INTEGER,
         allowNull: true,
       },
       comment: {
         type: DataTypes.TEXT,
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
       tableName: 'feedback', // Małe litery
       timestamps: true,
     });

     Feedback.associate = models => {
       Feedback.belongsTo(models.User, {
         as: 'Client',
         foreignKey: 'clientId',
         onDelete: 'NO ACTION',
         onUpdate: 'CASCADE',
         constraintName: 'fk_feedback_client', // Unikalna nazwa klucza obcego
       });
       Feedback.belongsTo(models.User, {
         as: 'Provider',
         foreignKey: 'providerId',
         onDelete: 'NO ACTION',
         onUpdate: 'CASCADE',
         constraintName: 'fk_feedback_provider', // Unikalna nazwa klucza obcego
       });
     };

     return Feedback;
   };
