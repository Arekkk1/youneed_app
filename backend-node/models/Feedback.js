// backend-node/models/Feedback.js
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
    orderId: { // Dodano orderId, jeśli Feedback jest powiązany z Order
        type: DataTypes.INTEGER,
        allowNull: false, // Zazwyczaj feedback jest powiązany z konkretnym zamówieniem
        references: {
            model: 'orders', // Małe litery, nazwa tabeli dla Order
            key: 'id',
        },
        unique: true // Zazwyczaj jedno zamówienie ma jeden feedback
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true, // Lub false jeśli wymagane
      validate: { // Opcjonalna walidacja
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // createdAt i updatedAt będą zarządzane przez Sequelize dzięki timestamps: true
  }, {
    tableName: 'feedback', // Małe litery
    timestamps: true, // Sequelize doda createdAt i updatedAt
  });

  Feedback.associate = models => {
    Feedback.belongsTo(models.User, {
      as: 'Client',
      foreignKey: 'clientId',
      onDelete: 'NO ACTION', // lub CASCADE jeśli usunięcie użytkownika usuwa jego feedback
      onUpdate: 'CASCADE',
      // constraintName: 'fk_feedback_client',
    });
    Feedback.belongsTo(models.User, {
      as: 'Provider',
      foreignKey: 'providerId',
      onDelete: 'NO ACTION', // lub CASCADE
      onUpdate: 'CASCADE',
      // constraintName: 'fk_feedback_provider',
    });
    Feedback.belongsTo(models.Order, { // Powiązanie z Order
        as: 'Order',
        foreignKey: 'orderId',
        onDelete: 'CASCADE', // Jeśli usunięcie zamówienia usuwa feedback
        onUpdate: 'CASCADE',
        // constraintName: 'fk_feedback_order',
    });
  };

  return Feedback;
};
