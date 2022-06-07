const express = require('express');
const router = express.Router();

const Command = require('../controllers/commands.controller');
const { validateToken } = require('../middleware/auth.middleware');

router.get('/', Command.getCommands);
router.post('/', validateToken, Command.postInfo);

module.exports = router;