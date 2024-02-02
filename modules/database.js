require('dotenv').config();

const mariadb = require("mariadb");
const bcrypt = require('bcrypt');

const USER_NAME = process.env.DB_USER;
const USER_PASS = process.env.DB_PASS;


const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    database: USER_NAME,
    user: USER_NAME,
    password: USER_PASS
});

const registerUser = async (username, password, realName, dateOfBirth, bio, avatarUrl) => {
    try {
        // 检查用户名是否已存在
        const existingUsers = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUsers.length > 0) {
            return { success: false, message: 'Username is already taken.' };
        }

        // 哈希用户密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 插入新用户到数据库
        await pool.query(
            'INSERT INTO users (username, password_hash, real_name, date_of_birth, bio, avatar_url) VALUES (?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, realName, dateOfBirth, bio, avatarUrl]
        );

        return { success: true, message: 'User registered successfully.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Database error occurred.' };
    }
};


module.exports = {
    registerUser,
    pool
};
