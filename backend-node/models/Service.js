module.exports = (sequelize, DataTypes) => {
      const Service = sequelize.define('Service', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: DataTypes.STRING,
        description: DataTypes.TEXT,
        price: DataTypes.DECIMAL(10, 2),
        duration: DataTypes.INTEGER, // Duration in minutes or hours? Clarify unit.
        category: DataTypes.STRING,
        providerId: {
          type: DataTypes.INTEGER,
          references: { model: 'Users', key: 'id' },
          allowNull: false,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      });
    
      Service.associate = models => {
        Service.belongsTo(models.User, { as: 'Provider', foreignKey: 'providerId' });
        Service.hasMany(models.Order, { foreignKey: 'serviceId' });
      };
    
      return Service;
    };
