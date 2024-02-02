// Load a .env file if one exists
require('dotenv').config()

const express = require("express");
const handlebars = require("express-handlebars");
const app = express();
app.use(express.static('public'));

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

app.listen(port, function () {
    console.log(`Web final project listening on http://localhost:${port}/`);
});
