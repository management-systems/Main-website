const express = require('express');
const router = express.Router();
const { submitContact, getSubmissions } = require('../controllers/contactController');

router.post('/', submitContact);
router.get('/submissions', getSubmissions);

module.exports = router;
