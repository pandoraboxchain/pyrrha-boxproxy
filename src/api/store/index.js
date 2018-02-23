'use strict';
const express = require('express');
const router = express.Router();
const controller = require('./store.controller');

router.get('/', controller.getStore);

module.exports = router;
