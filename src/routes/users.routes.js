const express = require('express');
const router = express.Router();

const User = require('../controllers/users.controller');
const { validateToken } = require('../middleware/auth.middleware');

router.get('/', validateToken, User.fetchUser);
router.post('/', User.doRegister);
router.post('/login', User.doLogin);

module.exports = router;