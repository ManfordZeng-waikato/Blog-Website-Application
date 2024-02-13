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

    document.getElementById('articles').addEventListener('submit', event => {
        if (event.target.classList.contains('comment-form')) {
            event.preventDefault(); // 阻止表单默认提交行为
            const articleId = event.target.getAttribute('data-article-id');
            const commentContent = event.target.querySelector('textarea[name="comment"]').value;
            postComment(articleId, commentContent);
        }
    });
});


function postComment(articleId, commentContent) {
    fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            content: commentContent,
            // 如果是回复评论，还可以添加 parentCommentId
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Comment posted successfully');
                loadCommentsForArticle(articleId); // 重新加载评论以展示新评论
            } else {
                alert('Failed to post comment');
            }
        })
        .catch(error => console.error('Error posting comment:', error));
}


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
                     <button class="toggle-comments-btn" data-article-id="${article.id}">Show Comments</button>
                    <div class="comments-container" data-article-id="${article.id}" style="display: none;">
                        <!-- 评论内容将通过JavaScript动态加载 -->
                        ${isLoggedIn ? '<form class="comment-form" data-article-id="' + article.id + '"><textarea name="comment" placeholder="Leave a comment..."></textarea>' +
                    '<button type="submit">Submit</button></form>' : ''}
                    </div>
                `;
                articlesContainer.appendChild(articleElement);
                const toggleCommentsBtn = articleElement.querySelector(`.toggle-comments-btn[data-article-id="${article.id}"]`);
                toggleCommentsBtn.addEventListener('click', toggleCommentsVisibility);
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

function toggleCommentsVisibility(event) {
    const articleId = event.target.getAttribute('data-article-id');
    const commentsContainer = document.querySelector(`.comments-container[data-article-id="${articleId}"]`);
    const isVisible = commentsContainer.style.display === 'block';

    commentsContainer.style.display = isVisible ? 'none' : 'block';
    event.target.textContent = isVisible ? 'Show Comments' : 'Hide Comments';
}


function loadCommentsForArticle(articleId) {
    fetch(`/api/articles/${articleId}/comments`)
        .then(response => response.json())
        .then(data => {
            if (data.success && Array.isArray(data.comments)) {
                const commentsContainer = document.querySelector(`.comments-container[data-article-id="${articleId}"]`);
                let commentsHtml = renderComments(data.comments);

                // 如果用户已登录，确保在评论HTML字符串中包含评论表单
                if (isLoggedIn) {
                    commentsHtml += `
                        <div class="comment-form-container">
                            <form class="comment-form" data-article-id="${articleId}">
                                <textarea name="comment" placeholder="Leave a comment..."></textarea>
                                <button type="submit">Submit</button>
                            </form>
                        </div>
                    `;
                }

                commentsContainer.innerHTML = commentsHtml;
                addReplyButtonListeners(articleId); // 新增的函数调用
                addDeleteCommentListeners(articleId)
                bindCommentFormSubmitListener(articleId);// 重新为评论表单绑定提交事件监听器

            } else {
                console.error('Unexpected response format:', data);
            }
        })
        .catch(error => console.error('Error loading comments:', error));
}

function addDeleteCommentListeners(articleId) {
    const deleteButtons = document.querySelectorAll(`.comments-container[data-article-id="${articleId}"] .delete-comment-button`);
    deleteButtons.forEach(button => {
        // 检查是否已经为按钮绑定了点击事件监听器
        if (!button.classList.contains('event-bound')) {
            button.addEventListener('click', function() {
                const commentId = this.getAttribute('data-comment-id');
                deleteComment(articleId, commentId);
            });
            // 标记按钮，表示已绑定事件监听器
            button.classList.add('event-bound');
        }
    });
}

function deleteComment(articleId, commentId) {
    fetch(`/api/articles/${articleId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Failed to delete comment');
            }
        })
        .then(data => {
            if (data.success) {
                alert('Comment deleted successfully');
                // 重新加载评论以更新显示
                loadCommentsForArticle(articleId);
            } else {
                alert(data.message);
            }
        })
        .catch(error => console.error('Error deleting comment:', error));
}



function bindCommentFormSubmitListener(articleId) {
    const commentForm = document.querySelector(`.comment-form[data-article-id="${articleId}"]`);
    if (commentForm) {
        commentForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const commentContent = this.querySelector('textarea[name="comment"]').value;
            postComment(articleId, commentContent);
        });
    }
}
function addReplyButtonListeners(articleId) {
    const replyButtons = document.querySelectorAll(`.comments-container[data-article-id="${articleId}"] .reply-button`);
    replyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const commentId = this.getAttribute('data-comment-id');
            showReplyForm(commentId, articleId);
        });
    });
}

function showReplyForm(commentId, articleId) {
    // 查找评论并在其下显示回复表单
    const commentElement = document.querySelector(`.comment[data-comment-id="${commentId}"]`);
    const replyFormHtml = `
        <form class="reply-form" data-article-id="${articleId}" data-parent-id="${commentId}">
            <textarea name="reply" placeholder="Write a reply..."></textarea>
            <button type="submit">Reply</button>
        </form>
    `;
    // 插入回复表单到评论下方
    commentElement.insertAdjacentHTML('afterend', replyFormHtml);
    // 为新添加的回复表单添加事件监听器，处理回复提交
    addReplyFormSubmitListener(articleId);
}

function addReplyFormSubmitListener(articleId) {
    const replyForms = document.querySelectorAll(`.reply-form[data-article-id="${articleId}"]`);
    replyForms.forEach(form => {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            const parentCommentId = this.getAttribute('data-parent-id');
            const replyContent = this.querySelector('textarea[name="reply"]').value;
            postReply(articleId, parentCommentId, replyContent, this);
        });
    });
}

function postReply(articleId, parentCommentId, replyContent, formElement) {
    fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            content: replyContent,
            parent_id: parentCommentId,
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Reply posted successfully');
                formElement.remove(); // Optionally remove the form after successful submission
                loadCommentsForArticle(articleId); // Reload comments to display the new reply
            } else {
                alert('Failed to post reply');
            }
        })
        .catch(error => console.error('Error posting reply:', error));
}

function renderComments(comments, level = 0, articleAuthorId) {
    let html = '';
    comments.forEach(comment => {
        html += `
            <div class="comment" style="margin-left: ${level * 20}px" data-comment-id="${comment.id}">
                <p><strong>${comment.username}</strong> (${new Date(comment.created_at).toLocaleString()}):</p>
                <p>${comment.content}</p>
                ${isLoggedIn && (comment.user_id === userId || articleAuthorId === userId) ? `<button class="delete-comment-button" data-comment-id="${comment.id}">Delete</button>` : ''}
                ${isLoggedIn ? `<button class="reply-button" data-comment-id="${comment.id}">Reply</button>` : ''}
            </div>
        `;
        if (comment.replies && comment.replies.length > 0) {
            html += renderComments(comment.replies, level + 1, articleAuthorId);
        }
    });
    return html;
}

