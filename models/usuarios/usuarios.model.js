// para generar los modelos se usa: npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string,password:string
import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const Usuarios = sequelize.define('Usuarios', {
    id_usuario: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    id_tipousuario: {
        type: DataTypes.INTEGER,
        allowNull: false
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
        type: DataTypes.DATE,
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
    // Almacena hash bcrypt (~60 chars); se usa VARCHAR(255) para margen
    codigo: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    id_estado: {
        type: DataTypes.INTEGER,
        allowNull: false
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
        type: DataTypes.DATE,
        allowNull: false
    },
    id_genero: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_estatus_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_estatus_marital: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_categoria_vivienda: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'Usuarios'
});

export default Usuarios;