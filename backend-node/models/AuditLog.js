module.exports = (sequelize, DataTypes) => {
     const AuditLog = sequelize.define('AuditLog', {
       id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
       action: DataTypes.STRING,
       details: DataTypes.JSON,
       ip: DataTypes.STRING,
       adminId: {
         type: DataTypes.INTEGER,
         references: { model: 'users', key: 'id' },
         allowNull: true,
       },
       targetUserId: DataTypes.INTEGER,
       targetResourceId: DataTypes.INTEGER,
       targetResourceType: DataTypes.STRING,
       createdAt: DataTypes.DATE,
       updatedAt: DataTypes.DATE,
     }, {
       tableName: 'auditlogs', // Małe litery
       timestamps: true,
     });

     AuditLog.associate = models => {
       AuditLog.belongsTo(models.User, {
         as: 'Admin',
         foreignKey: 'adminId',
         onDelete: 'SET NULL',
         onUpdate: 'CASCADE',
         constraintName: 'fk_auditlog_admin', // Unikalna nazwa klucza obcego
       });
     };

     return AuditLog;
   };
