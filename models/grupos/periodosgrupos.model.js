import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const PeriodosGrupos = sequelize.define('PeriodosGrupos', {
    id_periodogrupo: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    id_grupo: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Grupos',
            key: 'id_grupo'
        }
    },
    id_periodo: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Periodos',
            key: 'id_periodo'
        }
    },
    id_estatus_grupo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'EstatusGrupos',
            key: 'id_estatusgrupo'
        }
    },
    id_responsable_grupo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id_usuario'
        }
    },
    hora_inicio: {
        type: DataTypes.TIME,
        allowNull: true
    },
    lugar_imparticion: {
        type: DataTypes.STRING(250),
        allowNull: true
    }
}, {
    timestamps: false,
    tableName: 'PeriodosGrupos',
    indexes: [
        { name: 'Idx_PeriodoGrupo', fields: ['id_periodogrupo', 'id_grupo', 'id_periodo'] }
    ]
});

PeriodosGrupos.associate = (models) => {
    PeriodosGrupos.belongsTo(models.Grupos, { foreignKey: 'id_grupo', targetKey: 'id_grupo' });
    PeriodosGrupos.belongsTo(models.Periodos, { foreignKey: 'id_periodo', targetKey: 'id_periodo' });
    PeriodosGrupos.belongsTo(models.EstatusGrupos, {
        foreignKey: 'id_estatus_grupo',
        targetKey: 'id_estatusgrupo'
    });
    PeriodosGrupos.belongsTo(models.Usuarios, {
        foreignKey: 'id_responsable_grupo',
        targetKey: 'id_usuario'
    });
    PeriodosGrupos.hasMany(models.InscripcionesGrupos, {
        foreignKey: 'id_periodo_grupo',
        sourceKey: 'id_periodogrupo'
    });
};

export default PeriodosGrupos;







// CREATE TABLE PeriodosGrupos
// (
// 	   id_periodogrupo int AUTO_INCREMENT PRIMARY KEY NOT NULL,
//     id_grupo int ,
//     id_periodo int ,
//     id_estatus_grupo int NOT  NULL ,
//     id_responsable_grupo int NOT NULL ,
//     CONSTRAINT FK_Id_PeriodoGrupo FOREIGN KEY (id_grupo) 
// 		REFERENCES Grupos (id_grupo) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT,
//     CONSTRAINT FK_Id_PeriodoPeriodo FOREIGN KEY (id_periodo) 
// 		REFERENCES Periodos (id_periodo) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT,
//     CONSTRAINT FK_Id_PeriodoGrupoEstatus FOREIGN KEY (id_estatus_grupo) 
// 		REFERENCES EstatusGrupos (id_estatusgrupo) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT,
//     CONSTRAINT FK_Id_PeriodoResponsableGrupo FOREIGN KEY (id_responsable_grupo) 
// 		REFERENCES Usuarios (id_usuario) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
// );