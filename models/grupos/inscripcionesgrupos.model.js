import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const InscripcionesGrupos = sequelize.define('InscripcionesGrupos', {
    id_inscripciongrupo: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    id_periodo_grupo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'PeriodosGrupos',
            key: 'id_periodogrupo'
        }
    },
    id_usuario_inscrito: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id_usuario'
        }
    }
},
{
    timestamps: false,
    tableName: 'InscripcionesGrupos',
    indexes: [
        {
            name: 'Idx_InscripcionGrupo',
            fields: ['id_inscripciongrupo', 'id_periodo_grupo', 'id_usuario_inscrito']
        }
    ]
});

InscripcionesGrupos.associate = (models) => {
    InscripcionesGrupos.belongsTo(models.PeriodosGrupos, {
        foreignKey: 'id_periodo_grupo',
        targetKey: 'id_periodogrupo'
    });
    InscripcionesGrupos.belongsTo(models.Usuarios, {
        foreignKey: 'id_usuario_inscrito',
        targetKey: 'id_usuario'
    });
    InscripcionesGrupos.hasMany(models.Asistencias, {
        foreignKey: 'id_inscripciongrupo',
        sourceKey: 'id_inscripciongrupo'
    });
};

export default InscripcionesGrupos;






// CREATE TABLE InscripcionesGrupos
// (
// 	   id_inscripciongrupo int AUTO_INCREMENT PRIMARY KEY NOT NULL,
//     id_periodo_grupo int NOT NULL,
//     id_usuario_inscrito int NOT NULL,
// 	CONSTRAINT FK_Id_InscripcionPeriodoGrupo FOREIGN KEY (id_periodo_grupo) 
// 		REFERENCES PeriodosGrupos (id_periodogrupo) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT,
// 	CONSTRAINT FK_Id_IncripcionUsuario FOREIGN KEY (id_usuario_inscrito) 
// 		REFERENCES Usuarios (id_usuario) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
// );



