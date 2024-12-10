const express = require('express');
const { manageScreenShot, manageUploads } = require('../controllers/dataVerseServiceController');

const router = express.Router();

router.post('/manageScreenShot', manageScreenShot);
router.post('/manageUploads', manageUploads);

module.exports = router;
