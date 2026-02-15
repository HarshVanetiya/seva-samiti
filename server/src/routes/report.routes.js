const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');

router.get('/organisation', reportController.getOrganisationReport);
router.get('/members', reportController.getMemberReport);
router.get('/backup', reportController.getDatabaseBackup);

module.exports = router;
