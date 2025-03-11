CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS servers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    server_name VARCHAR(255) NOT NULL,
    
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS server_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    server_id INT NOT NULL,
    preferences JSON NOT NULL,
    
    FOREIGN KEY (server_id) REFERENCES servers(id)
);