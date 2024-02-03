document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const username = loginForm.querySelector('input[type="text"]').value;
        const password = loginForm.querySelector('input[type="password"]').value;

        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const userBlogUrl = `/home/${data.username}`;
                    console.log('$'+data.username)
                    window.location.href = userBlogUrl; // 重定向到用户博客主页
                } else {
                    // 当用户不存在或密码错误时显示弹窗
                    if (data.message === 'User does not exist.') {
                        alert('User does not exist.'); // 弹窗显示用户不存在
                    } else if (data.message === 'Incorrect password.') {
                        alert('Incorrect password.'); // 弹窗显示密码错误
                    } else {
                        // 对于其他登录错误，显示在页面上
                        const loginError = document.getElementById('login-error');
                        loginError.textContent = data.message || 'Login failed. Please try again.';
                        loginError.style.display = 'block';
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                const loginError = document.getElementById('login-error');
                loginError.textContent = 'An unexpected error occurred. Please try again.';
                loginError.style.display = 'block';
            });

    });
});
