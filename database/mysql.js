//import mysql from 'mysql2/promise'; 
import { NODE_ENV, HOST, DB_USER, DB_PASSWORD, DATABASE } from '../config/env.js';
import { Sequelize } from 'sequelize';
//import { MySqlDialect } from '@sequelize/mysql';

const isMissing = (v) => v === undefined || v === null || String(v).trim() === '';
const missingDb = [];
if (isMissing(DATABASE)) missingDb.push('DATABASE');
if (isMissing(DB_USER)) missingDb.push('DB_USER');
if (isMissing(HOST)) missingDb.push('HOST');
if (missingDb.length > 0) {
    throw new Error(
        `Configuración de base de datos incompleta: faltan o están vacías ${missingDb.join(', ')}. ` +
        'Define estas variables en el archivo .env en la raíz del proyecto.'
    );
}

// Create the connection to database with sequelize
const sequelize = new Sequelize(DATABASE, DB_USER, DB_PASSWORD, {
    host: HOST,
    //DATABASE,
    //DB_USER,
    //DB_PASSWORD,
    port: 3306,
    dialect: 'mysql',
    logging: NODE_ENV === 'production' ? false : console.log,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

const connection = async () => {
    try{
        await sequelize.authenticate();
        console.log(`Database connected in ${NODE_ENV} mode`);
    }catch(err){
        console.log('Error connecting to the database', err);
        process.exit(1);
    }
}

export { sequelize }; 
export default connection;

// *******************************************************************************************************************
// *******************************************************************************************************************

