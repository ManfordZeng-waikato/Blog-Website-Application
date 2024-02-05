document.addEventListener('DOMContentLoaded', () => {
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
        if (event.target.classList.contains('like-button')) {
            const articleId = event.target.getAttribute('data-article-id');
            handleLike(articleId, event.target);
        }
    });
});


function handleLike(articleId, likeButton) {
    fetch(`/api/like/${articleId}`, { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 更新点赞按钮样式（例如，改变颜色或切换图标）
                likeButton.classList.add('liked');

                // 更新点赞数量
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
            articlesContainer.innerHTML = ''; // 清空文章列表

            articles.forEach(article => {
                const articleElement = document.createElement('div');
                articleElement.innerHTML = `
                    <h2>${article.title}</h2>
                    <p>Author: ${article.username}</p>
                    <p>Date: ${new Date(article.created_at).toLocaleDateString()}</p>
                    <p>${article.content}</p>
                    <a href="/posts/${article.id}">Read more...</a>
                    <div class="like-section">
                        <button class="like-button" data-article-id="${article.id}">Like</button>
                        <span class="like-count" data-article-id="${article.id}">0 likes</span>
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
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
}


