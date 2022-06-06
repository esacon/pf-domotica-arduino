const mongoose = require('mongoose');
const path = require('path');
require('colors');
require('dotenv').config({ path: path.resolve(__dirname, '../database/.env') });

const username = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const hostUrl = process.env.DB_URL;

const connection = (dbName) => {
    const URI = `mongodb+srv://${username}:${password}@${hostUrl}/${dbName}?retryWrites=true&w=majority`;
    return mongoose.connect(URI)
            .then(() => {
                console.log("\nBase de datos conectada con éxito.".yellow);
            })
            .catch((err) => {
                console.log("\nHa ocurrido un error al conectarse a la base de datos: ".red);
                console.log(err);
            });
};

module.exports = connection;
