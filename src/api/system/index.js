'use strict';
const express = require('express');
const router = express.Router();
const controller = require('./system.controller');

router.get('/version', controller.getVersion);

module.exports = router;
