const db = require('../config/db');

const obtenerTodos = async () => {
    const [rows] = await db.query('SELECT * FROM paquetes_citas');
    return rows;
};

const crear = async (datos) => {
    const { encabezado, categoria, titulo, subtitulo, precio, vigencia, beneficios, url_imagen, estado = 'ACTIVO', destacado = 0 } = datos;
    
    const [resultado] = await db.query(
        'INSERT INTO paquetes_citas (encabezado, categoria, titulo, subtitulo, precio, vigencia, beneficios, url_imagen, estado, destacado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [encabezado, categoria, titulo, subtitulo, precio, vigencia, beneficios, url_imagen || null, estado, destacado]
    );
    return resultado.insertId;
};

const actualizar = async (id, datos) => {
    const { encabezado, categoria, titulo, subtitulo, precio, vigencia, beneficios, url_imagen, estado, destacado } = datos;
    
    const [resultado] = await db.query(
        'UPDATE paquetes_citas SET encabezado = ?, categoria = ?, titulo = ?, subtitulo = ?, precio = ?, vigencia = ?, beneficios = ?, url_imagen = ?, estado = ?, destacado = ? WHERE id = ?',
        [encabezado, categoria, titulo, subtitulo, precio, vigencia, beneficios, url_imagen || null, estado, destacado, id]
    );
    return resultado.affectedRows;
};

const eliminar = async (id) => {
    const [resultado] = await db.query('DELETE FROM paquetes_citas WHERE id = ?', [id]);
    return resultado.affectedRows;
};

module.exports = { obtenerTodos, crear, actualizar, eliminar };