// backend-node/models/Notification.js
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    message: DataTypes.STRING,
    type: DataTypes.ENUM('announcement', 'warning', 'account', 'order', 'feedback', 'message'),
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    userId: {
      type: DataTypes.INTEGER,
      references: { model: 'Users', key: 'id' },
      allowNull: false,
    },
    relatedId: DataTypes.INTEGER,
    relatedType: DataTypes.STRING,
    // Usuń jawne definicje createdAt i updatedAt, aby Sequelize zarządzało nimi domyślnie
    // createdAt: DataTypes.DATE,
    // updatedAt: DataTypes.DATE,
  } /* Upewnij się, że nie ma tu { timestamps: false } */ );

  Notification.associate = models => {
    Notification.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return Notification;
};
