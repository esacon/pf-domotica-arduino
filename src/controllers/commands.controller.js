const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../database/.env') });

let data = "";

const postInfo = async (req, res) => {
    const { username, role } = req.user;
    data = {username, role, commands: req.body};
    res.status(200).send({});
}

const getCommands = async (req, res) => {
    const { username, role } = data;
    if (!username || !role) return res.status(401).send({ error: "No user authenticated." });
    if (role === 'admin') {
        const commands = data;
        return res.status(200).send(commands);
    }
    res.status(400).send({ error: 'User has not admin role.' });
}

module.exports = {
    postInfo, getCommands
}