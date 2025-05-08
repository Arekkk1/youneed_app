// backend-node/models/Equipment.js
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
    // createdAt i updatedAt będą zarządzane przez Sequelize dzięki timestamps: true
  }, {
    tableName: 'equipment', // Małe litery
    timestamps: true, // Sequelize doda createdAt i updatedAt
  });

  Equipment.associate = models => {
    Equipment.belongsTo(models.User, {
      as: 'Provider',
      foreignKey: 'providerId',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
      // constraintName: 'fk_equipment_provider',
    });
  };

  return Equipment;
};
