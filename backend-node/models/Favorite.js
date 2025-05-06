module.exports = (sequelize, DataTypes) => {
      const Favorite = sequelize.define('Favorite', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
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
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      }, {
        indexes: [
           { unique: true, fields: ['clientId', 'providerId'] } // Ensure a client favorites a provider only once
        ]
      });
    
      Favorite.associate = models => {
        Favorite.belongsTo(models.User, { as: 'Client', foreignKey: 'clientId' });
        Favorite.belongsTo(models.User, { as: 'Provider', foreignKey: 'providerId' });
      };
    
      return Favorite;
    };
