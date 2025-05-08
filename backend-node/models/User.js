module.exports = (sequelize, DataTypes) => {
     const User = sequelize.define('User', {
       id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true,
       },
       email: {
         type: DataTypes.STRING(255),
         allowNull: false,
         unique: true,
       },
       password: {
         type: DataTypes.STRING(255),
         allowNull: false,
       },
       firstName: {
         type: DataTypes.STRING(255),
         allowNull: true,
       },
       lastName: {
         type: DataTypes.STRING(255),
         allowNull: true,
       },
       companyName: {
         type: DataTypes.STRING(255),
         allowNull: true,
       },
       prefSmsAlerts: {
         type: DataTypes.TINYINT,
         allowNull: true,
       },
       createdAt: {
         type: DataTypes.DATE,
         allowNull: false,
       },
       updatedAt: {
         type: DataTypes.DATE,
         allowNull: false,
       },
     }, {
       tableName: 'users',
       timestamps: true,
     });

     User.associate = models => {
       // User as Client
       User.hasMany(models.Order, { as: 'ClientOrders', foreignKey: 'clientId' });
       User.hasMany(models.Feedback, { as: 'ClientFeedbacks', foreignKey: 'clientId' });
       User.hasMany(models.Favorite, { as: 'Favorites', foreignKey: 'clientId' });

       // User as Provider
       User.hasMany(models.Order, { as: 'ProviderOrders', foreignKey: 'providerId' });
       User.hasMany(models.Service, { as: 'Services', foreignKey: 'providerId' });
       User.hasMany(models.Feedback, { as: 'ProviderFeedbacks', foreignKey: 'providerId' });
       User.hasMany(models.OpeningHour, { as: 'OpeningHours', foreignKey: 'providerId' });
       User.hasMany(models.Employee, { as: 'Employees', foreignKey: 'providerId' });
       User.hasMany(models.Equipment, { as: 'Equipment', foreignKey: 'providerId' });
       User.hasMany(models.ProviderGoal, { as: 'ProviderGoals', foreignKey: 'providerId' });
       User.hasMany(models.Favorite, { as: 'FavoritedBy', foreignKey: 'providerId' });

       // General User associations
       User.hasOne(models.Address, { as: 'UserAddress', foreignKey: 'userId' });
       User.hasOne(models.CompanyDetail, { as: 'UserCompanyDetails', foreignKey: 'userId' });
       User.hasMany(models.Notification, { as: 'Notifications', foreignKey: 'userId' });
       User.hasMany(models.Subscription, { as: 'Subscriptions', foreignKey: 'userId' });

       // User as Admin (for Audit Logs)
       User.hasMany(models.AuditLog, { as: 'AdminLogs', foreignKey: 'adminId' });
     };

     // Helper method to get display name
     User.prototype.getName = function() {
       if (this.companyName) return this.companyName;
       return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.email;
     };

     return User;
   };
