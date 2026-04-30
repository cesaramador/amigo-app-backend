import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const UsuariosEncuestas = sequelize.define('UsuariosEncuestas', {
    id_usuario_encuesta: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id_usuario'
        }
    },
    id_encuesta: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Encuestas',
            key: 'id_encuesta'
        }
    },
    fecha_elaboracion_encuesta: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
}, {
    timestamps: false,
    tableName: 'UsuariosEncuestas',
    indexes: [
        { name: 'Idx_UsuarioEncuesta', fields: ['id_usuario_encuesta', 'id_usuario'] }
    ]
});

UsuariosEncuestas.associate = (models) => {
    UsuariosEncuestas.belongsTo(models.Usuarios, {
        foreignKey: 'id_usuario',
        targetKey: 'id_usuario'
    });
    UsuariosEncuestas.belongsTo(models.Encuestas, {
        foreignKey: 'id_encuesta',
        targetKey: 'id_encuesta'
    });
    UsuariosEncuestas.hasMany(models.DetalleUsuariosEncuestas, {
        foreignKey: 'id_usuario_encuesta',
        sourceKey: 'id_usuario_encuesta'
    });
};

export default UsuariosEncuestas;