'use strict';
const express = require('express');
const router = express.Router();
const controller = require('./system.controller');

router.get('/version', controller.getVersion);
router.get('/addresses', controller.getAddresses);
router.get('/runtime', controller.getRuntimeProperties);
router.get('/state', controller.getState);

// @todo Remove or secure these API endpoints on production
router.post('/reset/baseline', controller.resetBaseline);
router.post('/reset/baseline/:id', controller.resetBaseline);
router.get('/loglevel', controller.getLogLevel);
router.post('/loglevel/:level', controller.setLogLevel);
router.get('/subscriptions', controller.getSubscriptionsList);

module.exports = router;
