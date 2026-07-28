const mysql = require('mysql2');
require('dotenv').config();

// Creamos la conexión a la base de datos usando las variables del .env
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Habilitamos el uso de Promesas (async/await) para que el código sea más limpio
const promisePool = pool.promise();

// Probamos la conexión apenas inicie
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('¡Conectado exitosamente a la base de datos de Orbital Salud!');
        connection.release();
    }
});

module.exports = promisePool;