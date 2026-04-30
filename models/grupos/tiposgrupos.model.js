import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const TiposGrupos = sequelize.define('TiposGrupos', {
    id_tipogrupo: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    tipo_grupo: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    }
},
{
    timestamps: false,
    tableName: 'TiposGrupos',
    indexes: [
        { name: 'Idx_TipoGrupo', fields: ['id_tipogrupo'] }
    ]
});

TiposGrupos.associate = (models) => {
    TiposGrupos.hasMany(models.Grupos, { foreignKey: 'id_tipogrupo', sourceKey: 'id_tipogrupo' });
};

export default TiposGrupos;





// CREATE TABLE TiposGrupos
// (
// 	id_tipogrupo int AUTO_INCREMENT PRIMARY KEY NOT NULL,
// 	tipo_grupo varchar(30) -- danza, manualidades, etc.
// );