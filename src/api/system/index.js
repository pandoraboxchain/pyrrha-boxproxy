'use strict';
const express = require('express');
const router = express.Router();
const controller = require('./system.controller');

router.get('/version', controller.getVersion);
router.get('/addresses', controller.getAddresses);
router.get('/runtime', controller.getRuntimeProperties);
router.get('/state', controller.getState);

// @todo Remove this API endpoint on production
router.post('/reset/baseline', controller.resetBaseline);
router.post('/reset/baseline/:id', controller.resetBaseline);
router.get('/loglevel', controller.getLogLevel);
router.post('/loglevel/:level', controller.setLogLevel);

module.exports = router;
