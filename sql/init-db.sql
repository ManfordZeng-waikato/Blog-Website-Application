-- Your database initialisation SQL here
DROP TABLE IF EXISTS posts;
drop table if exists users;

CREATE TABLE IF NOT EXISTS users
(
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    real_name     VARCHAR(100),
    date_of_birth DATE,
    bio           TEXT,
    avatar_url    VARCHAR(255),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

INSERT INTO users (username, password_hash, real_name, date_of_birth, bio, avatar_url)
VALUES ('alice123', '$2b$10$3Bv0CPy4wVRnEbqZ/ozapO6keBLtLXHsvwu0SGadTq95U4QPPbsNS', 'Alice Johnson', '1990-04-23', 'Loves coding and digital art.',
        '/images/avatars/avatar3.png'),
       ('bob_smith', '$2b$10$3Bv0CPy4wVRnEbqZ/ozapO6keBLtLXHsvwu0SGadTq95U4QPPbsNS', 'Bob Smith', '1985-11-12', 'Avid hiker and photographer.',
        '/images/avatars/avatar3.png'),
       ('carol789', '$2b$10$3Bv0CPy4wVRnEbqZ/ozapO6keBLtLXHsvwu0SGadTq95U4QPPbsNS', 'Carol Taylor', '1992-07-08',
        'Enthusiastic about data science and machine learning.', '/images/avatars/avatar3.png');

-- 删除现有的posts表，如果它已经存在


-- 创建新的posts表
CREATE TABLE IF NOT EXISTS posts
(
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT,  -- 外键，关联到users表的id
    title       VARCHAR(255) NOT NULL,
    content     TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) -- 设置外键关联到users表的id
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 举例插入一些文章数据
INSERT INTO posts (user_id, title, content)
VALUES
    ((SELECT id FROM users WHERE username = 'alice123'), 'Alice\'s First Post', 'This is the content of Alice\'s first post.'),
    ((SELECT id FROM users WHERE username = 'bob_smith'), 'Bob\'s Adventure', 'This is the content of Bob\'s post about his recent adventure.'),
    ((SELECT id FROM users WHERE username = 'carol789'), 'Data Science in Action', 'This is Carol\'s post about her data science projects.');
