module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define('Employee', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: DataTypes.STRING,
    // Kolumna 'position' jest oczekiwana przez zapytanie, upewnij się, że istnieje w DB
    position: {
        type: DataTypes.STRING,
        allowNull: true // Lub false jeśli wymagane
    },
    // services: DataTypes.JSON, // Consider a separate EmployeeService table for many-to-many if needed
    providerId: {
      type: DataTypes.INTEGER,
      references: { model: 'Users', key: 'id' },
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  }, {
    // Opcjonalnie: Jeśli nazwa tabeli w bazie danych jest inna niż domyślna liczba mnoga 'Employees'
    // tableName: 'your_employee_table_name'
  });

  Employee.associate = models => {
    Employee.belongsTo(models.User, { as: 'Provider', foreignKey: 'providerId' });
    // Dodaj inne powiązania, jeśli istnieją (np. z usługami)
  };

  return Employee;
};
