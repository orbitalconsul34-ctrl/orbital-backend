const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

// Rutas de doctores
router.get('/', doctorController.getDoctores);
router.get('/publicos', doctorController.getDoctoresPublicos); 

// Rutas de Turnos (¡Es importante que estén antes del /:id general!)
router.get('/:id/turnos', doctorController.getConfigTurnos);
router.put('/:id/turnos', doctorController.actualizarConfigTurnos);

router.get('/:id', doctorController.getPerfil);
router.post('/', doctorController.crearDoctor);
router.put('/:id', doctorController.actualizarDoctor);
router.delete('/:id', doctorController.eliminarDoctor);

module.exports = router;