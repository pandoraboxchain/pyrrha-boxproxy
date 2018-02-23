'use strict';
const express = require('express');
const router = express.Router();
const controller = require('./datasets.controller');

router.get('/', controller.getDatasets);

module.exports = router;
