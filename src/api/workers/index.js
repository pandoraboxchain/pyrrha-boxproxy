'use strict';
const express = require('express');
const router = express.Router();
const controller = require('./workers.controller');

router.get('/', controller.getWorkers);
router.get('/count', controller.getWorkerNodesCount);
router.get('/:id', controller.getWorkerById);
router.get('/address/:address', controller.getWorkerByAddress);

module.exports = router;
