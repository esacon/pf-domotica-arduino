const path = require('path');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: path.resolve(__dirname, '../database/.env') });

const validateToken = (req, res, next) => {
    const accessToken = req.headers['authentication'];
    if (!accessToken) return res.status(401).send({ error: 'No token provided in header.' });
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).send({ error: 'Token is invalid or has expired.' });
        req.user = user;
        next();
    });
}

module.exports = {
    validateToken
}