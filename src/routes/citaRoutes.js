const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');

// Públicas: las usa la página /reservar-cita
router.get('/disponibilidad/:idDoctor', citaController.getDisponibilidad);
router.post('/reservar', citaController.reservar);
router.post('/:id/pagar', citaController.pagar);
router.post('/:id/liberar', citaController.liberar);
router.put('/:id/reprogramar', citaController.reprogramar);
// Panel admin: agrega tu middleware de autenticación antes del controlador
// (ej: router.get('/', verificarToken, citaController.listar))
router.get('/', citaController.listar);

module.exports = router;