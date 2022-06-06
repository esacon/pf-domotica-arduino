const path = require('path');
const jwt = require('jsonwebtoken');
const crypt = require('../utils/encrypting.utils');
const userModel = require('../models/users.model');

require('dotenv').config({ path: path.resolve(__dirname, '../database/.env') });

const generateAccessWebToken = data => {
    return jwt.sign(data, process.env.ACCESS_TOKEN_SECRET)
}

const validateToken = accessToken => {
    return jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
}

// GET /users
const fetchUser = async (req, res) => {
    const { user_id } = req.query;
    const user = user_id ? await userModel.findById(user_id) : null;
    if (!user) return res.status(400).send({ error: 'Invalid user_id.' });
    return res.status(200).send({
        username: user.username,
        email: user.email,
        role: user.role
    });
}

// POST /users/login
const doLogin = async (req, res) => {
    const { username, password, token } = req.body;
    if (token) {
        const decodedInfo = validateToken(token);
        const user = decodedInfo.id ? await userModel.findById(decodedInfo.id) : null;
        if (!user) res.send(403).send({ error: "Invalid token." });
        return res.status(200).send({});
    } else if (username) {
        const user = await userModel.findOne({ username });
        const passwordCorrect = user === null ? false : crypt.comparePassword(password, user.password);
        if (!user || !passwordCorrect) {
            return res.status(401).send({ error: "Invalid user or password." })
        }
        const token = generateAccessWebToken({ id: user._id, username: user.username, role: user.role });
        return res.status(200).send({token});
    }
    return res.status(500).send({
        error: "Token or username is required."
    });
}

// POST /users
const doRegister = async (req, res) => {
    const { username, email, role, password } = req.body;    
    const result = await userModel.find({username: req.body.username});
    if (result.length) return res.status(400).send({ error: 'User already exists.' });
    if (!username || !email || !role || !password) return res.status(500).send({ error: 'Información incompleta.' });
    const user = new userModel({
        ...req.body,
        password: crypt.cryptPassword(password)
    });
    try {
        await user.save();
        const token = generateAccessWebToken({ id: user._id, name: user.username, role: user.role });
        return res.status(201).send({token});
    } catch (error) {
        return res.status(500).send(error);
    }
}

module.exports = {
    fetchUser, doRegister, doLogin
}
