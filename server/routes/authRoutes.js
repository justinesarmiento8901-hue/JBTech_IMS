const express = require('express');
const router = express.Router();
const { login, me, register } = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', authenticate, me);
router.post('/register', authenticate, requireRole('admin'), register);

module.exports = router;