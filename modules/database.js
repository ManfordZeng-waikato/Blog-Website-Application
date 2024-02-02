require('dotenv').config();

const mariadb = require("mariadb");

const USER_NAME = process.env.DB_USER;
const USER_PASS = process.env.DB_PASS;

const database = mariadb.createConnection({
    host: process.env.DB_HOST,
    database: USER_NAME,
    user: USER_NAME,
    password: USER_PASS
});




module.exports = database;
