// Example: Create this file if you decide to normalize company details
    module.exports = (sequelize, DataTypes) => {
      const CompanyDetail = sequelize.define('CompanyDetail', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        employeeCount: DataTypes.INTEGER,
        // openingHours: DataTypes.JSON, // Redundant if using OpeningHour model
        // services: DataTypes.JSON, // Redundant if using Service model
        // Add other company-specific fields here (e.g., NIP, REGON)
        nip: DataTypes.STRING,
        regon: DataTypes.STRING,
        userId: { // Should link to the provider User
          type: DataTypes.INTEGER,
          references: { model: 'users', key: 'id' },
          allowNull: false,
          unique: true // Assuming one detail record per provider user
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },{
       tableName: 'companydetails', // Małe litery
       timestamps: true,
     });
    
      CompanyDetail.associate = models => {
        CompanyDetail.belongsTo(models.User, { foreignKey: 'userId' });
        // Potentially link to OpeningHours and Services if needed, but primary link is via User(provider)
      };
    
      return CompanyDetail;
    };
