const db = require('../config/db');

const obtenerTodos = async () => {
    const [rows] = await db.query('SELECT * FROM productos_tienda');
    return rows;
};

const crear = async (datosProducto) => {
    const { 
        nombre, marca, especialidad, precio, precio_antes, stock = 0, indicacion, presentacion, 
        descripcion, beneficios, url_imagen_cloudinary = null, estado = 'ACTIVO'
    } = datosProducto;
    
    const [resultado] = await db.query(
        'INSERT INTO productos_tienda (nombre, marca, especialidad, precio, precio_antes, stock, indicacion, presentacion, descripcion, beneficios, url_imagen_cloudinary, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [nombre, marca, especialidad, precio, precio_antes || null, stock, indicacion, presentacion, descripcion, beneficios, url_imagen_cloudinary, estado]
    );
    return resultado.insertId;
};

const actualizar = async (id, datosProducto) => {
    const { 
        nombre, marca, especialidad, precio, precio_antes, stock, indicacion, presentacion, 
        descripcion, beneficios, url_imagen_cloudinary, estado 
    } = datosProducto;

    const [resultado] = await db.query(
        'UPDATE productos_tienda SET nombre = ?, marca = ?, especialidad = ?, precio = ?, precio_antes = ?, stock = ?, indicacion = ?, presentacion = ?, descripcion = ?, beneficios = ?, url_imagen_cloudinary = ?, estado = ? WHERE id = ?',
        [nombre, marca, especialidad, precio, precio_antes || null, stock, indicacion, presentacion, descripcion, beneficios, url_imagen_cloudinary, estado, id]
    );
    return resultado.affectedRows;
};

const eliminar = async (id) => {
    const [resultado] = await db.query('DELETE FROM productos_tienda WHERE id = ?', [id]);
    return resultado.affectedRows;
};

const obtenerPorId = async (id) => {
    const [rows] = await db.query('SELECT * FROM productos_tienda WHERE id = ?', [id]);
    return rows[0];
};

module.exports = { obtenerPorId, obtenerTodos, crear, actualizar, eliminar };