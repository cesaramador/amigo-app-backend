import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const Grupos = sequelize.define('Grupos', {
    id_grupo: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    nombre_grupo: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    id_tipogrupo: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'TiposGrupos',
            key: 'id_tipogrupo'
        }
    }
},
{
    timestamps: false,
    tableName: 'Grupos',
    indexes: [
        { name: 'Idx_Grupo', fields: ['id_grupo'] }
    ]
});

Grupos.associate = (models) => {
    Grupos.belongsTo(models.TiposGrupos, { foreignKey: 'id_tipogrupo', targetKey: 'id_tipogrupo' });
    Grupos.hasMany(models.PeriodosGrupos, { foreignKey: 'id_grupo', sourceKey: 'id_grupo' });
};

export default Grupos;








// CREATE TABLE Grupos
// (
// 	    id_grupo int AUTO_INCREMENT PRIMARY KEY NOT NULL,
// 	    nombre_grupo varchar(100) NOT NULL,
//      id_tipogrupo int ,
//      CONSTRAINT FK_Id_GrupoTipoGrupo FOREIGN KEY (id_tipogrupo) 
// 		    REFERENCES TiposGrupos (id_tipogrupo) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
// );