//import mysql from 'mysql2/promise'; 
import { NODE_ENV, HOST, USER, PASSWORD, DATABASE } from '../config/env.js';
import { Sequelize } from 'sequelize';
//import { MySqlDialect } from '@sequelize/mysql';

if(!DATABASE && !HOST && !USER && !PASSWORD) {
    throw new Error('Please define the Database enviroment variable inside .env.<development|production>.local');
}

// Create the connection to database with sequelize
const sequelize = new Sequelize(DATABASE, USER, PASSWORD, {
    host: HOST,
    USER,
    PASSWORD,
    DATABASE,
    port: 3306,
    dialect: 'mysql',
    logging: console.log,
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

// A simple SELECT query for displaying users using async/await and mysql2/promise
// try {
//   const [results, fields] = await connection.query(
//     'SELECT * FROM `usuarios`'
//   );

//   console.log(results); // results contains rows returned by server
//   console.log(fields); // fields contains extra meta data about results, if available
// } catch (err) {
//     console.log(err);
// }


// Create the connection to database with mysql2/promise
// const connection = async () => {
//     try{
//         await mysql.createConnection({
//             host: HOST,
//             user: USER, 
//             password: PASSWORD,
//             database: DATABASE
//         })
//         console.log(`Database connected in ${NODE_ENV} mode`);
//     }catch(err){
//         console.log('Error connecting to the database', err);
//         process.exit(1);
//     }
// }
