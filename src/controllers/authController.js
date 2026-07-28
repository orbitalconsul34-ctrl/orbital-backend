const adminModel = require('../models/adminModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Endpoint para crear el primer administrador (Lo usarás en Postman)
const registrar = async (req, res) => {
    try {
        const { correo, password } = req.body;
        
        // Encriptar la contraseña (creamos un 'salt' y luego hasheamos)
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        
        // Guardar en la base de datos
        const nuevoId = await adminModel.crearAdmin(correo, password_hash);
        res.status(201).json({ mensaje: 'Administrador creado exitosamente', id: nuevoId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear administrador' });
    }
};

// 2. Endpoint de Login (El que usará tu panel en React)
const login = async (req, res) => {
    try {
        const { correo, password } = req.body;

        // Verificar si existe el usuario en la base de datos
        const admin = await adminModel.buscarPorCorreo(correo);
        if (!admin) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Comparar la contraseña enviada con el hash indescifrable guardado
        const passwordValida = await bcrypt.compare(password, admin.password_hash);
        if (!passwordValida) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Crear el token JWT (El "pase VIP")
        // Idealmente, en un futuro pasaremos 'secreto_super_seguro' a tu archivo .env
        const token = jwt.sign(
            { id: admin.id, correo: admin.correo },
            process.env.JWT_SECRET || 'secreto_super_seguro',
            { expiresIn: '8h' } // El token durará 8 horas
        );

        res.json({ mensaje: 'Login exitoso', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

module.exports = { registrar, login };