const bcrypt = require('bcrypt');

const cryptPassword = (password) => bcrypt.hashSync(password, bcrypt.genSaltSync(10));

const comparePassword = (password, hash) => bcrypt.compareSync(password, hash);

module.exports = {cryptPassword, comparePassword};