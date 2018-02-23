'use strict';
const express = require('express');
const router = express.Router();
const controller = require('./abi.controller');

router.get('/', controller.getAbi);

module.exports = router;
