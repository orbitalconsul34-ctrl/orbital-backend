const db = require('../config/db');

const obtenerTodos = async () => {
    const [rows] = await db.query('SELECT * FROM paquetes_citas');
    return rows;
};

const crear = async (datos) => {
    // Agregamos categoria y mas_elegido. url_imagen es opcional.
    const { nombre_paquete, descripcion, cantidad_sesiones, precio_total, url_imagen, estado = 'ACTIVO', categoria = 'PLAN COMBINADO', mas_elegido = 0 } = datos;
    
    const [resultado] = await db.query(
        'INSERT INTO paquetes_citas (nombre_paquete, descripcion, cantidad_sesiones, precio_total, url_imagen, estado, categoria, mas_elegido) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [nombre_paquete, descripcion, cantidad_sesiones, precio_total, url_imagen || null, estado, categoria, mas_elegido]
    );
    return resultado.insertId;
};

const actualizar = async (id, datos) => {
    const { nombre_paquete, descripcion, cantidad_sesiones, precio_total, url_imagen, estado, categoria, mas_elegido } = datos;
    
    const [resultado] = await db.query(
        'UPDATE paquetes_citas SET nombre_paquete = ?, descripcion = ?, cantidad_sesiones = ?, precio_total = ?, url_imagen = ?, estado = ?, categoria = ?, mas_elegido = ? WHERE id = ?',
        [nombre_paquete, descripcion, cantidad_sesiones, precio_total, url_imagen || null, estado, categoria, mas_elegido, id]
    );
    return resultado.affectedRows;
};

const eliminar = async (id) => {
    const [resultado] = await db.query('DELETE FROM paquetes_citas WHERE id = ?', [id]);
    return resultado.affectedRows;
};

module.exports = { obtenerTodos, crear, actualizar, eliminar };