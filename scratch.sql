SELECT posts.id AS id, posts.title AS title, posts.url AS url, posts.userId AS userId, posts.createdAt AS createdAt, users.username AS username
FROM posts 
JOIN users
ON posts.userId=users.id
WHERE userId=1 
ORDER BY createdAt 
DESC LIMIT 5


INSERT INTO 
posts 
(title, url, userId, createdAt, subredditId)
VALUES
('another title of post', 'www.yahoo.ca', 1, null, 2)


INSERT INTO
users
(username, password, createdAt)
VALUES
('User Number 3', '123', null)

INSERT INTO
users
(username, password, createdAt)
VALUES
('User Number 4', 123, null)



