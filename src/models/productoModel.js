const db = require('../config/db');

const obtenerTodos = async () => {
    const [rows] = await db.query('SELECT * FROM productos_tienda');
    return rows;
};

const crear = async (datosProducto) => {
    // Agregamos categoria, especialidad y beneficios
    const { 
        nombre, descripcion, precio, stock = 0, estado = 'ACTIVO', 
        url_imagen_cloudinary = null, categoria = '', especialidad = '', beneficios = '' 
    } = datosProducto;
    
    const [resultado] = await db.query(
        'INSERT INTO productos_tienda (nombre, descripcion, precio, stock, estado, url_imagen_cloudinary, categoria, especialidad, beneficios) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [nombre, descripcion, precio, stock, estado, url_imagen_cloudinary, categoria, especialidad, beneficios]
    );
    return resultado.insertId;
};

const actualizar = async (id, datosProducto) => {
    const { 
        nombre, descripcion, precio, stock, estado, 
        url_imagen_cloudinary, categoria, especialidad, beneficios 
    } = datosProducto;

    const [resultado] = await db.query(
        'UPDATE productos_tienda SET nombre = ?, descripcion = ?, precio = ?, stock = ?, estado = ?, url_imagen_cloudinary = ?, categoria = ?, especialidad = ?, beneficios = ? WHERE id = ?',
        [nombre, descripcion, precio, stock, estado, url_imagen_cloudinary, categoria, especialidad, beneficios, id]
    );
    return resultado.affectedRows;
};

const eliminar = async (id) => {
    const [resultado] = await db.query('DELETE FROM productos_tienda WHERE id = ?', [id]);
    return resultado.affectedRows;
};

const obtenerPorId = async (id) => {
    const [rows] = await db.query('SELECT * FROM productos_tienda WHERE id = ?', [id]);
    return rows[0]; // Retorna solo el primer producto encontrado
};

module.exports = {
    obtenerPorId,
    obtenerTodos,
    crear,
    actualizar,
    eliminar
};