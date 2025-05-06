module.exports = (sequelize, DataTypes) => {
     const Employee = sequelize.define('Employee', {
       id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true,
       },
       name: {
         type: DataTypes.STRING,
         allowNull: true,
       },
       position: {
         type: DataTypes.STRING,
         allowNull: true,
       },
       providerId: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
           model: 'users',
           key: 'id',
         },
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
       tableName: 'employees', // Małe litery
       timestamps: true,
     });

     Employee.associate = models => {
       Employee.belongsTo(models.User, {
         as: 'Provider',
         foreignKey: 'providerId',
         onDelete: 'NO ACTION',
         onUpdate: 'CASCADE',
         constraintName: 'fk_employee_provider', // Unikalna nazwa klucza obcego
       });
     };

     return Employee;
   };
