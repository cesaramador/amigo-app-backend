import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const InscripcionesGrupos = sequelize.define('InscripcionesGrupos', {
    id_inscripciongrupo: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    id_periodo_grupo: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_usuario_inscrito: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
},
{
    timestamps: false,
    tableName: 'InscripcionesGrupos'
});

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



