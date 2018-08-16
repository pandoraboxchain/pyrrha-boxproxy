'use strict';
const express = require('express');
const router = express.Router();
const controller = require('./jobs.controller');

router.get('/', controller.getJobs);
router.get('/address/:address', controller.getJobByAddress); 

module.exports = router;
