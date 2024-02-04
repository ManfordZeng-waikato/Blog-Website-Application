document.addEventListener('DOMContentLoaded', () => {
    const sortOptions = document.querySelectorAll('.sort-option');

    sortOptions.forEach(option => {
        option.addEventListener('click', (event) => {
            const sortBy = event.target.getAttribute('data-sort-by');
            const sortDirection = event.target.getAttribute('data-sort-direction');
            fetchAndDisplayArticles(sortBy, sortDirection);
        });
    });
});

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
                `;
                articlesContainer.appendChild(articleElement);
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
}
