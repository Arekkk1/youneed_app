module.exports = (sequelize, DataTypes) => {
      const ProviderGoal = sequelize.define('ProviderGoal', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        goal: DataTypes.TEXT,
        providerId: {
          type: DataTypes.INTEGER,
          references: { model: 'Users', key: 'id' },
          allowNull: false,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      });
    
      ProviderGoal.associate = models => {
        ProviderGoal.belongsTo(models.User, { as: 'Provider', foreignKey: 'providerId' });
      };
    
      return ProviderGoal;
    };
