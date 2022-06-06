const express = require('express');
const app = express();
const db_connection = require('./database/connection');
require('colors');
require('dotenv').config({ path: __dirname + '/database/.env' });

// Settings
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
});

// Rutas
app.use('/users', require('./routes/users.routes'));

const server = app.listen(PORT, async () => {
    await db_connection(process.env.DB_NAME);
    console.log(`\nServidor iniciado en http://localhost:${PORT}.`.green);
});

module.exports = { app, server };