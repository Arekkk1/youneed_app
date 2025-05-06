module.exports = (sequelize, DataTypes) => {
     const Notification = sequelize.define('Notification', {
       id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true,
       },
       message: {
         type: DataTypes.STRING(255),
         allowNull: true,
       },
       type: {
         type: DataTypes.ENUM('announcement', 'warning', 'account', 'order', 'feedback', 'message'),
         allowNull: true,
       },
       isRead: {
         type: DataTypes.BOOLEAN,
         defaultValue: false,
       },
       userId: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
           model: 'users', // Małe litery
           key: 'id',
         },
       },
       relatedId: {
         type: DataTypes.INTEGER,
         allowNull: true,
       },
       relatedType: {
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
       tableName: 'notifications', // Małe litery
       timestamps: true,
     });

     Notification.associate = models => {
       Notification.belongsTo(models.User, {
         as: 'User',
         foreignKey: 'userId',
         onDelete: 'NO ACTION',
         onUpdate: 'CASCADE',
         constraintName: 'fk_notification_user', // Unikalna nazwa klucza obcego
       });
     };

     return Notification;
   };
