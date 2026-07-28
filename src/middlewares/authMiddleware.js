const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    // Capturamos el token que viene en los headers de la petición
    const authHeader = req.header('Authorization');

    // Si no hay token, bloqueamos el acceso inmediatamente
    if (!authHeader) {
        return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
    }

    try {
        // El formato estándar es "Bearer <token>", así que separamos la palabra "Bearer" del token real
        const token = authHeader.split(' ')[1];

        // Verificamos si el token es válido usando la misma clave secreta
        // (Asegúrate de usar la misma clave que pusiste en el authController)
        const verificado = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro');
        
        // Si es válido, guardamos los datos del administrador en la petición y continuamos
        req.admin = verificado;
        next(); // ¡Abre el candado y deja pasar la petición!
        
    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};

module.exports = { verificarToken };