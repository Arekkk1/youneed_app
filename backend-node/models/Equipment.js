module.exports = (sequelize, DataTypes) => {
  const Equipment = sequelize.define('Equipment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: DataTypes.STRING,
    // Kolumna 'description' jest oczekiwana przez zapytanie, upewnij się, że istnieje w DB
    description: {
        type: DataTypes.TEXT,
        allowNull: true // Lub false jeśli wymagane
    },
    quantity: DataTypes.INTEGER,
    providerId: {
      type: DataTypes.INTEGER,
      references: { model: 'Users', key: 'id' },
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  }, {
     // Opcjonalnie: Jeśli nazwa tabeli w bazie danych jest inna niż domyślna liczba mnoga 'Equipment'
    // tableName: 'your_equipment_table_name'
  });

  Equipment.associate = models => {
    Equipment.belongsTo(models.User, { as: 'Provider', foreignKey: 'providerId' });
  };

  return Equipment;
};
