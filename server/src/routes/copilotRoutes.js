const express = require('express');
const router = express.Router();
const copilotController = require('../controllers/copilotController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/query', copilotController.queryCopilot);

module.exports = router;
