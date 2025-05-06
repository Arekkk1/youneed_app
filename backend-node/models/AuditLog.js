module.exports = (sequelize, DataTypes) => {
      const AuditLog = sequelize.define('AuditLog', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        action: DataTypes.STRING,
        details: DataTypes.JSON,
        ip: DataTypes.STRING,
        adminId: { // Changed from userId to adminId for clarity if only admins perform audited actions
          type: DataTypes.INTEGER,
          references: { model: 'Users', key: 'id' },
          allowNull: true, // Allow system actions or actions by non-admins if needed
        },
        targetUserId: DataTypes.INTEGER, // Optional: ID of the user affected by the action
        targetResourceId: DataTypes.INTEGER, // Optional: ID of the resource affected (e.g., orderId, serviceId)
        targetResourceType: DataTypes.STRING, // Optional: Type of the resource affected
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE, // Usually not updated, but good practice to include
      });
    
      AuditLog.associate = models => {
        AuditLog.belongsTo(models.User, { as: 'Admin', foreignKey: 'adminId' });
      };
    
      return AuditLog;
    };
