document.addEventListener('DOMContentLoaded', function () {
    const postsContainer = document.querySelector('.posts-list');
    postsContainer.addEventListener('click', function (event) {
        const btn = event.target.closest('.delete-article-btn');  // 确保我们获取到正确的按钮
        if (btn) {
            const articleId = btn.getAttribute('data-article-id');
            console.log(articleId); // 再次检查articleId的值
            if (articleId && confirm('Are you sure you want to delete this article?')) {
                deleteArticle(articleId);
            }
        }
    });
});

function deleteArticle(articleId) {
    console.log('articleID',articleId);
    fetch(`/api/articles/${articleId}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 删除成功，从界面上移除文章
                const articleElement = document.querySelector(`.post[data-article-id="${articleId}"]`);
                articleElement.remove();
                alert('Article deleted successfully.');
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}


