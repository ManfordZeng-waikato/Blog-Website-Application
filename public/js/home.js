let isLoggedIn = false; // 默认用户未登录

// 检查用户是否登录
function checkLoginStatus() {
    return fetch('/api/isLoggedIn')
        .then(response => response.json())
        .then(data => {
            isLoggedIn = data.isLoggedIn;
        })
        .catch(error => console.error('Error:', error));
}

document.addEventListener('DOMContentLoaded', async () => {
    await checkLoginStatus(); // 等待检查登录状态

    const sortOptions = document.querySelectorAll('.sort-option');

    sortOptions.forEach(option => {
        option.addEventListener('click', (event) => {
            const sortBy = event.target.getAttribute('data-sort-by');
            const sortDirection = event.target.getAttribute('data-sort-direction');
            fetchAndDisplayArticles(sortBy, sortDirection);
        });
    });

    fetchAndDisplayArticles();

    document.getElementById('articles').addEventListener('click', event => {
        if (event.target.classList.contains('like-button') && isLoggedIn) {
            const articleId = event.target.getAttribute('data-article-id');
            handleLike(articleId, event.target);
        } else if (event.target.classList.contains('like-button') && !isLoggedIn) {
            alert('Please log in to like articles.');
        }
    });
});

function handleLike(articleId, likeButton) {
    fetch(`/api/like/${articleId}`, { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                likeButton.classList.add('liked');
                const likeCountElement = document.querySelector(`.like-count[data-article-id="${articleId}"]`);
                likeCountElement.textContent = `${data.likes} likes`;
            } else {
                alert(data.message);
            }
        })
        .catch(error => console.error('Error:', error));
}

function fetchAndDisplayArticles(sortBy, sortDirection) {
    fetch(`/api/articles?sort_by=${sortBy}&sort_direction=${sortDirection}`)
        .then(response => response.json())
        .then(articles => {
            const articlesContainer = document.getElementById('articles');
            articlesContainer.innerHTML = ''; // 清空文章列表以展示新内容

            articles.forEach(article => {
                const articleElement = document.createElement('div');
                articleElement.innerHTML = `
                    <h2>${article.title}</h2>
                    <p>Author: ${article.username}</p>
                    <p>Date: ${new Date(article.created_at).toLocaleDateString()}</p>
                    <p>${article.content}</p>
                    <div class="like-section">
                        <button class="like-button" data-article-id="${article.id}">${isLoggedIn ? 'Like' : 'Login to like'}</button>
                        <span class="like-count" data-article-id="${article.id}">0 likes</span>
                    </div>
                    <div class="comments-container" data-article-id="${article.id}">
                        <!-- 评论内容将通过JavaScript动态加载 -->
                        ${isLoggedIn ? '<form class="comment-form" data-article-id="' + article.id + '"><textarea name="comment" placeholder="Leave a comment..."></textarea>' +
                    '<button type="submit">Submit</button></form>' : ''}
                    </div>
                `;
                articlesContainer.appendChild(articleElement);
                // 获取并渲染点赞数据
                fetch(`/api/articles/${article.id}/likes`)
                    .then(response => response.json())
                    .then(likeData => {
                        if (likeData.success) {
                            const likeButton = articleElement.querySelector(`.like-button[data-article-id="${article.id}"]`);
                            const likeCount = articleElement.querySelector(`.like-count[data-article-id="${article.id}"]`);

                            likeCount.textContent = `${likeData.totalLikes} likes`; // 更新点赞数

                            if (likeData.userLiked) {
                                likeButton.classList.add('liked'); // 如果用户已点赞，更新按钮样式
                                likeButton.textContent = 'Liked'; // 更新按钮文本
                            }
                        }
                    });


                // 如果用户已登录，为这篇文章加载评论
                if (isLoggedIn) {
                    loadCommentsForArticle(article.id);
                }
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function loadCommentsForArticle(articleId) {
    // 实现加载评论的逻辑...
}
