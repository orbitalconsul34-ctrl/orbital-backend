const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./src/config/db');

// Importamos las rutas
const productoRoutes = require('./src/routes/productoRoutes');
const authRoutes = require('./src/routes/authRoutes');
const doctorRoutes = require('./src/routes/doctorRoutes');
const publicacionesRoutes = require('./src/routes/publicacionesRoutes');
const pacienteRoutes = require('./src/routes/pacienteRoutes');
const paqueteRoutes = require('./src/routes/paqueteRoutes');
const citaRoutes = require('./src/routes/citaRoutes'); // NUEVA: reservas de citas

const app = express();

// IMPORTANTE PARA RENDER: Usar process.env.PORT
const PORT = process.env.PORT || 3000;

// Aquí está el CORS permitiendo que tu frontend en Vercel se conecte
app.use(cors());
app.use(express.json());

// Configuramos el endpoint principal para cada ruta
app.use('/api/doctores', doctorRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/publicaciones', publicacionesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/paquetes', paqueteRoutes);
app.use('/api/citas', citaRoutes); // NUEVA: reservas de citas

app.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS resultado');
        res.json({
            mensaje: '¡El servidor de Orbital Salud está funcionando perfectamente!',
            prueba_bd: `MySQL responde correctamente. Resultado de prueba: ${rows[0].resultado}`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error de conexión a la base de datos' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});