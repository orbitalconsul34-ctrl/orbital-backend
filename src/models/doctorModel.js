const db = require('../config/db');

const obtenerTodos = async () => {
    const [rows] = await db.query('SELECT * FROM doctores');
    return rows;
};

// Nueva función para insertar un doctor
const crear = async (datosDoctor) => {
    // Extraemos los datos del objeto que nos enviará el controlador
    const { nombres, especialidad, correo_corporativo, id_saludtools } = datosDoctor;
    
    // Los signos de interrogación (?) evitan inyecciones SQL (seguridad)
    const [resultado] = await db.query(
        'INSERT INTO doctores (nombres, especialidad, correo_corporativo, id_saludtools) VALUES (?, ?, ?, ?)',
        [nombres, especialidad, correo_corporativo, id_saludtools]
    );
    
    // Retornamos el ID del doctor recién creado
    return resultado.insertId;
};

const actualizar = async (id, datosDoctor) => {
    const { nombres, especialidad, correo_corporativo, id_saludtools } = datosDoctor;
    const [resultado] = await db.query(
        'UPDATE doctores SET nombres = ?, especialidad = ?, correo_corporativo = ?, id_saludtools = ? WHERE id = ?',
        [nombres, especialidad, correo_corporativo, id_saludtools, id]
    );
    // affectedRows nos dice cuántas filas fueron modificadas (debería ser 1)
    return resultado.affectedRows; 
};

// Función para eliminar un doctor
const eliminar = async (id) => {
    const [resultado] = await db.query('DELETE FROM doctores WHERE id = ?', [id]);
    return resultado.affectedRows;
};

module.exports = {
    obtenerTodos,
    crear,
    actualizar,
    eliminar
};