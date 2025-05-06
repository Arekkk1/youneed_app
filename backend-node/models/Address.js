// Example: Create this file if you decide to normalize the address field from User model
    module.exports = (sequelize, DataTypes) => {
      const Address = sequelize.define('Address', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        street: DataTypes.STRING,
        city: DataTypes.STRING,
        zipCode: DataTypes.STRING,
        country: DataTypes.STRING,
        userId: {
          type: DataTypes.INTEGER,
          references: { model: 'users', key: 'id' },
          allowNull: false,
          unique: true // Assuming one address per user
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      });
    
      Address.associate = models => {
        Address.belongsTo(models.User, { foreignKey: 'userId' });
      };
    
      return Address;
    };
