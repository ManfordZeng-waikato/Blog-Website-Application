document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('username');
    const usernameFeedback = document.getElementById('username-feedback');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const registerForm = document.getElementById('register-form');
    const realName = document.getElementById('real-name');
    const dateOfBirth = document.getElementById('dob');
    const bio = document.getElementById('description');

    // 用户名即时验证
    usernameInput.addEventListener('input', () => {
        const username = usernameInput.value;
        fetch(`/check-username?username=${username}`)
            .then(response => response.json())
            .then(data => {
                if (data.isTaken) {
                    usernameFeedback.textContent = "Username is already taken.";
                    usernameFeedback.style.color = 'red';
                } else {
                    usernameFeedback.textContent = "Username is available.";
                    usernameFeedback.style.color = 'green';
                }
            })
            .catch(error => console.error('Error:', error));
    });
    registerForm.addEventListener('submit', (event) => {
        event.preventDefault(); // 阻止默认提交行为

        if (passwordInput.value !== confirmPasswordInput.value) {
            alert('Passwords do not match.');
            return false;
        }

        // 构建要发送的数据
        const formData = {
            username: usernameInput.value,
            password: passwordInput.value,
            realName: realName.value,
            dateOfBirth:dateOfBirth.value,
            bio:bio.value,

        };

        // 发送POST请求到服务器的注册端点
        fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
            .then(response => {
                if (!response.ok) {
                    // 如果不是2xx响应，尝试读取并抛出错误信息
                    return response.json().then(data => { throw new Error(data.message || 'Unknown error'); });
                }
                return response.json();
            })
            .then(data => {
                // 处理响应
                window.location.href = '/login';
            })
            .catch(error => {
                console.error('Error:', error);
            });
    });

});
