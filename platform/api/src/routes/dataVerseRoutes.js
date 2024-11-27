const express = require('express');
const { manageScreenShot } = require('../controllers/dataVerseServiceController');

const router = express.Router();

router.post('/manageScreenShot', manageScreenShot);

module.exports = router;
