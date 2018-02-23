'use strict';
const express = require('express');
const router = express.Router();
const controller = require('./kernels.controller');

router.get('/', controller.getKernels);

module.exports = router;
