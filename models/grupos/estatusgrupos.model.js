import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const EstatusGrupos = sequelize.define('EstatusGrupos', {
    id_estatusgrupo: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    estatus_grupo: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    }
},
{
    timestamps: false,
    tableName: 'EstatusGrupos',
    indexes: [
        { name: 'Idx_EstatusGrupo', fields: ['id_estatusgrupo'] }
    ]
});

EstatusGrupos.associate = (models) => {
    EstatusGrupos.hasMany(models.PeriodosGrupos, {
        foreignKey: 'id_estatus_grupo',
        sourceKey: 'id_estatusgrupo'
    });
};

export default EstatusGrupos;





// CREATE TABLE EstatusGrupos
// (
// 	id_estatusgrupo int AUTO_INCREMENT PRIMARY KEY NOT NULL,
// 	estatus_grupo varchar(20) -- vigente, suspendido, cancelado, etc.
// );
