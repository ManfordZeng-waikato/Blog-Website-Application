-- Your database initialisation SQL here
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
VALUES ('alice123', 'hashed_password1', 'Alice Johnson', '1990-04-23', 'Loves coding and digital art.',
        'https://example.com/avatars/alice.jpg'),
       ('bob_smith', 'hashed_password2', 'Bob Smith', '1985-11-12', 'Avid hiker and photographer.',
        'https://example.com/avatars/bob.jpg'),
       ('carol789', 'hashed_password3', 'Carol Taylor', '1992-07-08',
        'Enthusiastic about data science and machine learning.', 'https://example.com/avatars/carol.jpg');
