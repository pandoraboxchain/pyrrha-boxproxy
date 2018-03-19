'use strict';
const express = require('express');
const router = express.Router();
const controller = require('./kernels.controller');

router.get('/', controller.getKernels);
router.get('/address/:address', controller.getKernelByAddress);

module.exports = router;
