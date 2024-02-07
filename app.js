// Load a .env file if one exists
require('dotenv').config()


const express = require("express");
const session = require('express-session');
const handlebars = require("express-handlebars");
const {pool} = require('./modules/database.js');
const {registerUser, getUserInfoByUsername, getUserPosts, updateUserAccount, saveArticle, deleteArticle, getArticleById} = require("./modules/database");
const {getUserByUsername} = require("./modules/database");
const {compare} = require("bcrypt");
const moment = require('moment');
require('json-bigint');
const multer = require("multer");
const path = require("path");
const app = express();
const eq = (arg1, arg2) => arg1 === arg2;
const hbs = handlebars.create({
    defaultLayout: 'main',
    helpers: {
        eq, // 注册eq helper
    }
});
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET, // 用来注册session id到cookie的，相当于一个密钥。
    resave: false,
    saveUninitialized: false,
}));
// Listen port will be loaded from .env file, or use 3000 if
const port = process.env.EXPRESS_PORT || 3000;

// Setup Handlebars
app.engine('handlebars', hbs.engine);
app.set("view engine", "handlebars");

// Set up to read POSTed form data
app.use(express.urlencoded({extended: true}));
app.use(express.json({}));


// TODO: Your app here
app.get('/', (req, res) => {
    res.render('home', {
        blogTitle: 'My Awesome Blog',
        currentYear: new Date().getFullYear(),
        posts: [
            // 假设这里是你的博客文章数组
            {id: 1, title: 'Post 1', summary: 'This is the first post.'},
            {id: 2, title: 'Post 2', summary: 'This is the second post.'}
            // 更多博客文章...
        ]
    });
});

app.get('/login', (req, res) => {
    res.render('login', {layout: 'main'}); // 'login' 是你的handlebars模板文件名（不包含.handlebars后缀）
});
app.get('/register', (req, res) => {
    res.render('register', {layout: 'main'});
});
app.get('/edit-account/:username', async (req, res) => {
    const username = req.params.username;
    try {
        const userInfo = await getUserByUsername(username); // 从数据库获取用户信息
        if (!userInfo) {
            res.status(404).send('User not found');
            return;
        }

        // 定义可用的头像数组
        const avatars = [
            '/images/avatars/avatar1.png',
            '/images/avatars/avatar2.png',
            '/images/avatars/avatar3.png',
            '/images/avatars/avatar4.png',
            '/images/avatars/avatar5.png',
            '/images/avatars/avatar6.png',
            '/images/avatars/avatar7.png',
            '/images/avatars/avatar8.png',
            '/images/avatars/avatar9.png',
            '/images/avatars/avatar10.png',
        ];

        // 将用户信息和头像数组传递到模板
        res.render('edit-account', {
            layout: 'main',
            user: userInfo,
            avatars: avatars
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }

});


app.get('/my-articles/:username', async (req, res) => {
    if (!req.session.user) {
        // 如果用户未登录，重定向到登录页面
        return res.redirect('/login');
    }

    try {
        const username = req.params.username;
        const userInfo = await getUserByUsername(username); // 从数据库获取用户信息
        const userPosts = await getUserPosts(userInfo.id);// 获取用户的文章列表

        res.render('my-articles', {
            user: userInfo,
            posts: userPosts,
            isLoggedIn: true,
            blogTitle: 'Your Blog Title', // 如果需要，可以从配置文件或环境变量获取
            currentYear: new Date().getFullYear()
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});


app.get('/check-username', async (req, res) => {
    const username = req.query.username;
    const users = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    res.json({isTaken: users.length > 0});
});


app.get('/new-article', (req, res) => {
    if (!req.session.user) {
        // 如果用户未登录，重定向到登录页面
        return res.redirect('/login');
    }
    res.render('new-article', {
        layout: 'main',
        blogTitle: 'Write a New Article', // 设置页面标题
        user: req.session.user, // 传递用户信息，如果需要的话
        isLoggedIn: true // 传递登录状态
    });
});




app.post('/register', async (req, res) => {
    const {username, password, realName, dateOfBirth, bio, avatarUrl} = req.body;
    const result = await registerUser(username, password, realName, dateOfBirth, bio, avatarUrl);
    if (result.success) {
        res.json({success: true, message: 'Registration successful'}); // 使用JSON响应
    } else {
        res.status(400).json({success: false, message: result.message}); // 使用JSON响应
    }
});


app.post('/login', async (req, res) => {
    const {username, password} = req.body;

    try {
        const user = await getUserByUsername(username);
        if (!user) {
            // 用户不存在
            return res.status(401).json({success: false, message: 'User does not exist.'});
        }

        const isValidPassword = await compare(password, user.password_hash);
        if (!isValidPassword) {
            // 密码错误
            return res.status(401).json({success: false, message: 'Incorrect password.'});
        }

        // 用户名和密码验证通过
        req.session.user = {id: user.id, username: user.username};
        res.json({success: true, message: 'Logged in successfully.', username: user.username});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Internal server error.'});
    }
});

app.get('/home/:username', async (req, res) => {
    console.log(req.params)

    const username = req.params.username;
    try {
        const userInfo = await getUserByUsername(username);
        let userPosts = [];
        if (!userInfo) {
            res.status(404).send('User not found');
            return;
        }
        const isLoggedIn = req.session.user && req.session.user.username === userInfo.username;
        let userForTemplate = {};
        if (isLoggedIn) {
            const formattedBirthday = moment(userInfo.date_of_birth).format('YYYY-MM-DD');
            userPosts = await getUserPosts(userInfo.id);
            userForTemplate = {
                date_of_birth: formattedBirthday,
                name: userInfo.real_name,
                avatarUrl: userInfo.avatar_url,
                username: userInfo.username,
                posts: userPosts,// 用户的博客文章
                bio: userInfo.bio,

            };
        }
        res.render('home', {
            blogTitle: 'My Awesome Blog',
            currentYear: new Date().getFullYear(),
            user: userForTemplate,
            posts: userPosts,
            isLoggedIn: isLoggedIn
        });
        console.log(userPosts);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

app.post('/edit-account/:username', async (req, res) => {
    const oldUsername = req.params.username;
    const {username, realName, bio, avatarUrl} = req.body;

    if (req.session.user && req.session.user.username === oldUsername) {
        try {
            // 更新用户信息的数据库操作
            await updateUserAccount(oldUsername, username, realName, bio, avatarUrl);

            // 更新session信息
            req.session.user.username = username;

            res.redirect('/home/' + username); // 重定向到用户的个人主页
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error');
        }
    } else {
        res.status(403).send('Unauthorized');
    }
});


app.get('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(); // 销毁会话
    }
    res.redirect('/'); // 重定向到主页或登录页面
});


// app.js 或 server.js
app.get('/api/articles', async (req, res) => {
    const {sort_by, sort_direction} = req.query; // sort_by可以是'title', 'username', 'date'
    const sortDirection = sort_direction === 'desc' ? 'DESC' : 'ASC'; // 排序方向，如果未指定，默认升序（ASC）

    // 构建基础SQL查询，包括连接posts表和users表
    let sql = `
        SELECT posts.id, posts.title, posts.content, posts.created_at, users.username
        FROM posts
                 INNER JOIN users ON posts.user_id = users.id
    `;

    // 添加排序条件
    switch (sort_by) {
        case 'title':
            sql += ` ORDER BY posts.title ${sortDirection}`;
            break;
        case 'username':
            sql += ` ORDER BY users.username ${sortDirection}`;
            break;
        case 'date':
            sql += ` ORDER BY posts.created_at ${sortDirection}`;
            break;
        default:
            // 如果没有指定或指定的sort_by无效，则默认按日期排序
            sql += ` ORDER BY posts.created_at DESC`;
            break;
    }

    try {
        const articles = await pool.query(sql);
        res.json(articles);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

app.post('/api/like/:articleId', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({success: false, message: 'Please log in to like articles.'});
    }

    const userId = req.session.user.id;  // 假设你已经设置了用户登录的session
    const articleId = req.params.articleId;

    try {
        // 检查用户是否已经点赞了这篇文章
        const existingLike = await pool.query('SELECT * FROM likes WHERE user_id = ? AND article_id = ?', [userId, articleId]);
        if (existingLike.length > 0) {
            return res.status(400).json({success: false, message: 'You have already liked this article.'});
        }

        // 添加点赞记录
        await pool.query('INSERT INTO likes (user_id, article_id) VALUES (?, ?)', [userId, articleId]);

        // 获取更新后的点赞总数
        const likesResult = await pool.query('SELECT COUNT(*) AS likes FROM likes WHERE article_id = ?', [articleId]);
        const likes = Number(likesResult[0].likes); // 将 BigInt 转换为 Number

        res.json({success: true, likes: likes});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Internal server error.'});
    }
});

app.get('/api/articles/:articleId/likes', async (req, res) => {
    const articleId = req.params.articleId;
    try {
        const likesResult = await pool.query('SELECT COUNT(*) AS totalLikes FROM likes WHERE article_id = ?', [articleId]);
        const totalLikes = Number(likesResult[0].totalLikes);

        let userLiked = false;
        if (req.session.user) {
            const userId = req.session.user.id;
            const userLikeResult = await pool.query('SELECT * FROM likes WHERE user_id = ? AND article_id = ?', [userId, articleId]);
            userLiked = userLikeResult.length > 0;
        }

        res.json({success: true, totalLikes: totalLikes, userLiked: userLiked});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Internal server error.'});
    }
});


app.get('/my-articles/:username', async (req, res) => {
    if (!req.session.user || req.session.user.username !== req.params.username) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const userPosts = await getUserPosts(req.session.user.id);
        res.render('my-articles', {
            user: req.session.user,
            posts: userPosts,
            currentYear: new Date().getFullYear(),
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});







// 配置multer，设置文件存储位置
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/images/uploads/')  // 保存的路径，注意是相对当前脚本的路径
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))  // 将保存文件名设置为 字段名 + 时间戳 + 原始文件扩展名
    }
});
const upload = multer({ storage: storage });

app.post('/api/articles', upload.single('image'), async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { title, content } = req.body;

        const imageUrl = req.file ? '/uploads/' + path.basename(req.file.path) : ''; // 如果有上传文件，则获取文件URL
        // 这里添加保存文章和图片到数据库的逻辑

        const articleId = await saveArticle({ userId, title, content, imageUrl });
        res.json({ success: true, message: 'Article published successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

app.delete('/api/articles/:articleId', async (req, res) => {
    console.log('deleteAll', req.params);
    if (!req.session.user) {
        // 用户未登录
        return res.status(401).json({ success: false, message: 'Unauthorized: Please log in.' });
    }

    try {
        const articleId = req.params.articleId;
        console.log('delete id:', articleId);
        const article = await getArticleById(articleId);
        console.log('delete article:', article);

        if (!article) {
            // 文章不存在
            return res.status(404).json({ success: false, message: 'Article not found.' });
        }

        if (req.session.user.id !== article.user_id) {
            // 用户尝试删除非自己的文章
            return res.status(403).json({ success: false, message: 'Unauthorized: You can only delete your own articles.' });
        }

        // 首先删除与文章关联的点赞记录
        await pool.query('DELETE FROM likes WHERE article_id = ?', [articleId]);

        // 然后删除文章
        await deleteArticle(articleId);
        res.json({ success: true, message: 'Article deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});




app.listen(port, function () {
    console.log(`Web final project listening on http://localhost:${port}/`);
});
