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

const getUserByUsername = async (username) => {
    try {
        let result = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        console.log(result)
        if (result.length === 0) {
            return null; // 没有找到用户，返回null
        }
        return result[0]; // 返回查询到的第一个用户
    } catch (error) {
        console.error(error);
        throw error; // 将错误抛出，让调用者处理
    }
};

const getUserPosts = async (userId) => {
    try {
        const posts = await pool.query('SELECT * FROM posts WHERE user_id = ?', [userId]);
        return posts;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const updateUserAccount = async (oldUsername, newUsername, realName, bio, avatarUrl) => {
    // 使用你选择的数据库库进行操作，例如:
    const result = await pool.query('UPDATE users SET username = ?, real_name = ?, bio = ?, avatar_url = ? WHERE username = ?', [newUsername, realName, bio, avatarUrl, oldUsername]);
    return result;
};



// 函数来保存文章到数据库
async function saveArticle({ userId, title, content, imageUrl }) {
    try {
        const result = await pool.query(
            'INSERT INTO posts (user_id, title, content, image_url) VALUES (?, ?, ?, ?)',
            [userId, title, content, imageUrl]
        );
        console.log('Article saved:', result);
        return result.insertId; // 返回插入的文章ID
    } catch (error) {
        console.error('Error saving article:', error);
        throw error;
    }
}

async function getArticleById(articleId) {
    try {
        const result = await pool.query('SELECT * FROM posts WHERE id = ?', [articleId]);
        // 这里 result 是一个数组，即使查询结果只有一行
        if (result.length > 0) {
            return result[0];  // 返回第一行数据
        } else {
            return null;  // 如果没有找到文章，返回 null 或 appropriate value
        }
    } catch (error) {
        console.error('Error fetching article:', error);
        throw error;  // 保证错误能够被外部捕获
    }
}


async function deleteArticle(articleId) {
    try {
        await pool.query('DELETE FROM posts WHERE id = ?', [articleId]);
    } catch (error) {
        console.error('Error deleting article:', error);
        throw error;
    }
}


module.exports = {
    pool,
    saveArticle,
    getUserByUsername,
    registerUser,
    getUserPosts,
    updateUserAccount,
    getArticleById,
    deleteArticle

};
