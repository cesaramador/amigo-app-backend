// para generar los modelos se usa: npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string,password:string
import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }
import TiposUsuarios from './tiposusuarios.model.js';
import Estados from './estados.model.js';
import Municipios from './municipios.model.js';
import Generos from './generos.model.js';
import EstatusUsuarios from './estatususuarios.model.js';
import EstatusMaritales from './estatusmaritales.model.js';
import CategoriasViviendas from './categoriasviviendas.model.js';

const Usuarios = sequelize.define('Usuarios', {
    id_usuario: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    id_tipousuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3, // valor por defecto para usuario normal
        references: {
            model: 'TiposUsuarios',
            key: 'id_tipousuario'
        }
    },
    nombre: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    ap_paterno: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    ap_materno: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    fecha_nacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    telefono_personal: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true
    },
    telefono_contacto: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(200),
        allowNull: false,
        unique: true
    },
    // Hash bcrypt del código (~60 chars); columna BD: codigo varchar(100) NOT NULL
    codigo: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    id_estado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Estados',
            key: 'id_estado'
        }
    },
    id_municipio: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    colonia: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    calle: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    numero_int: {
        type: DataTypes.STRING(15),
        allowNull: true
    },
    numero_ext: {
        type: DataTypes.STRING(15),
        allowNull: true
    },
    codigo_postal: {
        type: DataTypes.STRING(5),
        allowNull: false
    },
    razon_social: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    rfc: {
        type: DataTypes.STRING(15),
        allowNull: true
    },
    fecha_registro: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    id_genero: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Generos',
            key: 'id_genero'
        }
    },
    id_estatus_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3, // valor por defecto para estatus pendiente
        references: {
            model: 'EstatusUsuarios',
            key: 'id_estatususuario'
        }
    },
    id_estatus_marital: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'EstatusMaritales',
            key: 'id_estatusmarital'
        }
    },
    id_categoria_vivienda: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'CategoriasViviendas',
            key: 'id_categoriavivienda'
        }
    }
}, {
    timestamps: false,
    tableName: 'Usuarios',
    indexes: [
        {
            name: 'Idx_Usuario',
            fields: ['id_usuario', 'id_tipousuario', 'nombre', 'ap_paterno', 'ap_materno', 'telefono_personal']
        }
    ]
});

Usuarios.belongsTo(TiposUsuarios, { foreignKey: 'id_tipousuario', targetKey: 'id_tipousuario' });

Usuarios.belongsTo(Estados, { foreignKey: 'id_estado', targetKey: 'id_estado' });

// En el SQL base la FK de id_municipio está comentada; se deja relación lógica sin constraint.
Usuarios.belongsTo(Municipios, { foreignKey: 'id_municipio', targetKey: 'id_municipio', constraints: false });

Usuarios.belongsTo(Generos, { foreignKey: 'id_genero', targetKey: 'id_genero' });

Usuarios.belongsTo(EstatusUsuarios, { foreignKey: 'id_estatus_usuario', targetKey: 'id_estatususuario' });

Usuarios.belongsTo(EstatusMaritales, { foreignKey: 'id_estatus_marital', targetKey: 'id_estatusmarital' });

Usuarios.belongsTo(CategoriasViviendas, { foreignKey: 'id_categoria_vivienda', targetKey: 'id_categoriavivienda' });

export default Usuarios;