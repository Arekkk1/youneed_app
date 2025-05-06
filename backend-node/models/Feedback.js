module.exports = (sequelize, DataTypes) => {
  const Feedback = sequelize.define('Feedback', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    rating: DataTypes.INTEGER,
    comment: DataTypes.TEXT,
    clientId: {
      type: DataTypes.INTEGER,
      references: { model: 'Users', key: 'id' },
      allowNull: false,
    },
    providerId: {
      type: DataTypes.INTEGER,
      references: { model: 'Users', key: 'id' },
      allowNull: false,
    },
    orderId: {
      type: DataTypes.INTEGER,
      references: { model: 'Orders', key: 'id' },
      allowNull: false, // Feedback must be linked to an order
      unique: true, // Only one feedback per order
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  }, {
    tableName: 'feedback', // Explicitly set the table name
    timestamps: true // Ensure Sequelize manages createdAt and updatedAt
  });

  Feedback.associate = models => {
    Feedback.belongsTo(models.User, { as: 'Client', foreignKey: 'clientId' });
    Feedback.belongsTo(models.User, { as: 'Provider', foreignKey: 'providerId' });
    Feedback.belongsTo(models.Order, { foreignKey: 'orderId' });
  };

  return Feedback;
};
