const db = require('../config/db');

const obtenerTodas = async () => {
    const [rows] = await db.query('SELECT * FROM publicaciones ORDER BY fecha_publicacion DESC');
    return rows;
};

const crear = async (datos) => {
    const { titulo, contenido_texto, tipo_publicacion, url_media, estado = 'ACTIVO' } = datos;
    const [resultado] = await db.query(
        'INSERT INTO publicaciones (titulo, contenido_texto, tipo_publicacion, url_media, estado) VALUES (?, ?, ?, ?, ?)',
        [titulo, contenido_texto, tipo_publicacion, url_media, estado]
    );
    return resultado.insertId;
};

const actualizar = async (id, datos) => {
    const { titulo, contenido_texto, tipo_publicacion, url_media, estado } = datos;
    const [resultado] = await db.query(
        'UPDATE publicaciones SET titulo = ?, contenido_texto = ?, tipo_publicacion = ?, url_media = ?, estado = ? WHERE id = ?',
        [titulo, contenido_texto, tipo_publicacion, url_media, estado, id]
    );
    return resultado.affectedRows;
};

const eliminar = async (id) => {
    const [resultado] = await db.query('DELETE FROM publicaciones WHERE id = ?', [id]);
    return resultado.affectedRows;
};

const obtenerPorId = async (id) => {
    // Buscamos donde el id coincida. 
    const [rows] = await db.query('SELECT * FROM publicaciones WHERE id = ?', [id]);
    // Retornamos rows[0] porque queremos un solo objeto, no un arreglo con un solo elemento
    return rows[0]; 
};
module.exports = { obtenerTodas, crear, actualizar, eliminar, obtenerPorId };