const express = require('express');
const router = express.Router();

// Importas tu controlador 
const publicacionesController = require('../controllers/publicacionesController'); 
// Importas el middleware de seguridad
const { verificarToken } = require('../middlewares/authMiddleware');

// RUTAS PÚBLICAS (Cualquiera puede ver el blog)
// Usamos los nombres exactos que pusiste en tu controlador
router.get('/', publicacionesController.getPublicaciones);

// Nota: Comenté esta ruta porque la función "obtenerPorId" aún no existe en tu controlador. 
// Cuando la crees, puedes descomentar esta línea.
router.get('/:id', publicacionesController.obtenerPorId);


// RUTAS PRIVADAS (Le ponemos "verificarToken" en el medio para exigir el Token)
// Solo dejamos un router.post (lo tenías duplicado arriba)
router.post('/', verificarToken, publicacionesController.crearPublicacion);
router.put('/:id', verificarToken, publicacionesController.actualizarPublicacion);
router.delete('/:id', verificarToken, publicacionesController.eliminarPublicacion);

module.exports = router;