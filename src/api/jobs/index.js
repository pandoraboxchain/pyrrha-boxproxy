'use strict';
const express = require('express');
const router = express.Router();
const controller = require('./jobs.controller');

router.get('/', controller.getJobs);

module.exports = router;
