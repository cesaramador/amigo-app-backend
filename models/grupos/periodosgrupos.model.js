import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const PeriodosGrupos = sequelize.define('PeriodosGrupos', {
    id_periodogrupo: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    id_grupo: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    id_periodo: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    id_estatus_grupo: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_responsable_grupo: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
},
{
    timestamps: false,
    tableName: 'PeriodosGrupos'
});

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