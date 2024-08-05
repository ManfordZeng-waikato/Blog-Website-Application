
const { getArticleById } = require('./database'); // 调整路径以匹配你的文件结构

async function testGetArticleById() {
    try {
        const articleId = 4; // 或你想测试的任何有效文章 ID
        const article = await getArticleById(articleId);
        console.log('Article fetched:', article);
    } catch (error) {
        console.error('Error during test:', error);
    }
}

testGetArticleById();
