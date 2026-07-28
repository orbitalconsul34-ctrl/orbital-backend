const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');

router.get('/', pacienteController.getPacientes);
router.post('/', pacienteController.crearPaciente);
router.put('/:id', pacienteController.actualizarPaciente);
router.delete('/:id', pacienteController.eliminarPaciente);

module.exports = router;