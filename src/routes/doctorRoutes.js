const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

router.get('/', doctorController.getDoctores);

// Nueva ruta POST (Usa la misma URL base, pero diferente método HTTP)
router.post('/', doctorController.crearDoctor);

router.put('/:id', doctorController.actualizarDoctor);
router.delete('/:id', doctorController.eliminarDoctor);

module.exports = router;