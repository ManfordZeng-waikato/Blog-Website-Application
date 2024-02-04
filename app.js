// Load a .env file if one exists
require('dotenv').config()

const express = require("express");
const session = require('express-session');
const handlebars = require("express-handlebars");
const { pool } = require('./modules/database.js');
const {registerUser, getUserInfoByUsername, getUserPosts} = require("./modules/database");
const {getUserByUsername} = require("./modules/database");
const {compare} = require("bcrypt");
const moment = require('moment');

const app = express();
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET, // 用来注册session id到cookie的，相当于一个密钥。
    resave: false,
    saveUninitialized: false,
}));
// Listen port will be loaded from .env file, or use 3000 if
const port = process.env.EXPRESS_PORT || 3000;

// Setup Handlebars
app.engine("handlebars", handlebars.create({
    defaultLayout: 'main'
}).engine);
app.set("view engine", "handlebars");

// Set up to read POSTed form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json({}));


// TODO: Your app here
app.get('/', (req, res) => {
    res.render('home', {
        blogTitle: 'My Awesome Blog',
        currentYear: new Date().getFullYear(),
        posts: [
            // 假设这里是你的博客文章数组
            { id: 1, title: 'Post 1', summary: 'This is the first post.' },
            { id: 2, title: 'Post 2', summary: 'This is the second post.' }
            // 更多博客文章...
        ]
    });
});

app.get('/login', (req, res) => {
    res.render('login', { layout: 'main' }); // 'login' 是你的handlebars模板文件名（不包含.handlebars后缀）
});
app.get('/register', (req, res) => {
    res.render('register', { layout: 'main' });
});

app.get('/check-username', async (req, res) => {
    const username = req.query.username;
    const users = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    res.json({ isTaken: users.length > 0 });
});

app.post('/register', async (req, res) => {
    const { username, password, realName, dateOfBirth, bio, avatarUrl } = req.body;
    const result = await registerUser(username, password, realName, dateOfBirth, bio, avatarUrl);
    if (result.success) {
        res.json({ success: true, message: 'Registration successful' }); // 使用JSON响应
    } else {
        res.status(400).json({ success: false, message: result.message }); // 使用JSON响应
    }
});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await getUserByUsername(username);
        if (!user) {
            // 用户不存在
            return res.status(401).json({ success: false, message: 'User does not exist.' });
        }

        const isValidPassword = await compare(password, user.password_hash);
        if (!isValidPassword) {
            // 密码错误
            return res.status(401).json({ success: false, message: 'Incorrect password.' });
        }

        // 用户名和密码验证通过
        req.session.user = { username: user.username };
        res.json({ success: true, message: 'Logged in successfully.', username: user.username  });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

app.get('/home/:username', async (req, res) => {
    console.log(req.params)

    const username = req.params.username;
    try {
        const userInfo = await getUserByUsername(username);
        if (!userInfo) {
            res.status(404).send('User not found');
            return;
        }
        const isLoggedIn = req.session.user && req.session.user.username === userInfo.username;
        let userForTemplate = {};
        if (isLoggedIn) {
            const formattedBirthday = moment(userInfo.date_of_birth).format('YYYY-MM-DD');
            const userPosts = await getUserPosts(userInfo.id);

            userForTemplate = {
                date_of_birth: formattedBirthday,
                name: userInfo.real_name,
                avatarUrl: userInfo.avatar_url,
                posts: userPosts // 用户的博客文章
            };
        }
        res.render('home', {
            blogTitle: 'My Awesome Blog',
            currentYear: new Date().getFullYear(),
            user: userForTemplate,
            isLoggedIn:isLoggedIn
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});



app.listen(port, function () {
    console.log(`Web final project listening on http://localhost:${port}/`);
});
