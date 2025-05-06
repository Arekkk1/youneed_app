'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
      role: {
        type: DataTypes.ENUM('client', 'provider', 'admin'),
        allowNull: false,
      },
      phoneNumber: {
        type: DataTypes.STRING(255),
      },
      companyName: {
        type: DataTypes.STRING(255),
      },
      profilePicture: {
        type: DataTypes.STRING(255),
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      industry: {
        type: DataTypes.STRING(255),
      },
      acceptTerms: {
        type: DataTypes.BOOLEAN,
      },
      marketingServices: {
        type: DataTypes.JSON,
      },
      firstName: {
        type: DataTypes.STRING(255),
      },
      lastName: {
        type: DataTypes.STRING(255),
      },
      subscriptionStatus: {
        type: DataTypes.ENUM('active', 'inactive', 'cancelled'),
      },
      subscriptionPrice: {
        type: DataTypes.FLOAT,
      },
      restrictions: {
        type: DataTypes.JSON,
      },
      phoneNumberVerified: {
        type: DataTypes.BOOLEAN,
      },
      marketingConsent: {
        type: DataTypes.BOOLEAN,
      },
      partnerConsent: {
        type: DataTypes.BOOLEAN,
      },
      tutorial: {
        type: DataTypes.BOOLEAN,
      },
      receiveNotifications: {
        type: DataTypes.BOOLEAN,
      },
      profileVisibility: {
        type: DataTypes.ENUM('public', 'private'),
      },
      resetPasswordToken: {
        type: DataTypes.STRING(255),
      },
      resetPasswordExpires: {
        type: DataTypes.DATE,
      },
      companyDetails: {
        type: DataTypes.JSON,
      },
      googleId: {
        type: DataTypes.STRING(255),
      },
      facebookId: {
        type: DataTypes.STRING(255),
      },
      addressStreet: {
        type: DataTypes.STRING(255),
      },
      addressApartment: {
        type: DataTypes.STRING(255),
      },
      addressCity: {
        type: DataTypes.STRING(255),
      },
      addressPostalCode: {
        type: DataTypes.STRING(255),
      },
      addressCountry: {
        type: DataTypes.STRING(255),
      },
      website: {
        type: DataTypes.STRING(255),
      },
      employees: {
        type: DataTypes.STRING(255),
      },
      visibilityStartDate: {
        type: DataTypes.DATE,
      },
      prefEmailMarketing: {
        type: DataTypes.BOOLEAN,
      },
      prefEmailPlatformUpdates: {
        type: DataTypes.BOOLEAN,
      },
      prefEmailOrderUpdatesClient: {
        type: DataTypes.BOOLEAN,
      },
      prefEmailPromotions: {
        type: DataTypes.BOOLEAN,
      },
      prefEmailNewOrder: {
        type: DataTypes.BOOLEAN,
      },
      prefEmailOrderUpdatesProvider: {
        type: DataTypes.BOOLEAN,
      },
      prefSmsAlerts: {
        type: DataTypes.BOOLEAN,
      },
    },
    {
      sequelize,
      modelName: 'users',
      tableName: 'users',
      timestamps: true,
    }
  );

  User.associate = models => {
    // User as Client
    User.hasMany(models.Order, { as: 'ClientOrders', foreignKey: 'clientId' });
    User.hasMany(models.Feedback, { as: 'ClientFeedbacks', foreignKey: 'clientId' });
    User.hasMany(models.Favorite, { as: 'Favorites', foreignKey: 'clientId' }); // Added Favorite association

    // User as Provider
    User.hasMany(models.Order, { as: 'ProviderOrders', foreignKey: 'providerId' });
    User.hasMany(models.Service, { as: 'Services', foreignKey: 'providerId' });
    User.hasMany(models.Feedback, { as: 'ProviderFeedbacks', foreignKey: 'providerId' });
    User.hasMany(models.OpeningHour, { as: 'OpeningHours', foreignKey: 'providerId' }); // Added OpeningHour association
    User.hasMany(models.Employee, { as: 'Employees', foreignKey: 'providerId' }); // Added Employee association
    User.hasMany(models.Equipment, { as: 'Equipment', foreignKey: 'providerId' }); // Added Equipment association
    User.hasMany(models.ProviderGoal, { as: 'ProviderGoals', foreignKey: 'providerId' }); // Added ProviderGoal association
    User.hasMany(models.Favorite, { as: 'FavoritedBy', foreignKey: 'providerId' }); // Added Favorite association

    // General User associations
    User.hasOne(models.Address, { foreignKey: 'userId', as: 'UserAddress' }); // Added Address association, specify alias if needed elsewhere
    User.hasOne(models.CompanyDetail, { foreignKey: 'userId', as: 'UserCompanyDetails' }); // Added CompanyDetail association
    User.hasMany(models.Notification, { foreignKey: 'userId' });
    User.hasMany(models.SmsCode, { foreignKey: 'userId' }); // Assuming SmsCode relates to User
    User.hasMany(models.Subscription, { foreignKey: 'userId' });
    User.hasMany(models.EmailCode, { foreignKey: 'userId' }); // Added EmailCode association

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
