

add dropdown list to createcontent to select subredditId
have subreddit header be auto generated from db query


add functionality to change page number and change listings per page

add comments to posts
add voting table

add sorting hot and new
need to store votes for this

reaact??



verify if actually writing new value to request header when sorting method changed








        SELECT posts.id AS posts_id, posts.title AS posts_title, 
        posts.url AS posts_url, posts.createdAt AS posts_createdAt, 
        posts.updatedAt AS posts_updatedAt, 
        posts.userId AS posts_userId, posts.subredditId AS posts_subredditId,
        
        subreddits.id AS subreddit_id, subreddits.name AS subreddit_name,
        subreddits.description AS subreddit_description, 
        subreddits.createdAt AS subreddit_createdAt,
        subreddits.updatedAt AS subreddit_updatedAt,
        
        users.id AS users_id, users.username AS users_username, 
        users.createdAt AS users_createdAt, users.updatedAt AS users_updatedAt,
        
        SUM(votes.vote) AS voteScore
        
        FROM posts
        JOIN users
        ON posts.userId=users.id
        JOIN subreddits
        ON posts.subredditId=subreddits.id
        LEFT JOIN votes
        ON posts.id=votes.postId
        WHERE users.id = 2
        AND subreddits.id = 2
        GROUP BY posts.id
        ORDER BY voteScore DESC,
        posts.createdAt DESC
        LIMIT 10


        ORDER BY voteScore DESC,
        posts.createdAt DESC















***REQUEST OBJECT*****

sessions_userId: 20,
sessions_token: '296m2m28u1z6u5yi665j4x2e6f54p3a6'
users_id: 20,
users_username: 'user123'

req.displayOptions.page
req.displayOptions.numPerPage



alter table votes add `createdAt` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'
alter table votes add updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP




CREATE TABLE votes (
postId INT, 
userId INT, 
vote TINYINT,
createdAt DATETIME,
updatedAt DATETIME
)


ALTER TABLE votes ADD PRIMARY KEY (postID, userId)

ALTER TABLE votes ADD FOREIGN KEY ('postId') REFERENCES posts('id') ON DELETE CASCADE,
ALTER TABLE votes ADD FOREIGN KEY (postId) REFERENCES posts(id)
ALTER TABLE votes ADD FOREIGN KEY (userId) REFERENCES users(id)

ALTER TABLE votes MODIFY column vote ENUM('-1', '0', '1')


ALTER TABLE votes ADD COLUMN updatedAt DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP


FOREIGN KEY (userId) REFERENCES users(id)

ALTER TABLE votes ADD createdAt DATETIME DEFAULT CURRENT_TIMESTAMP

ALTER TABLE `votes` ADD `updatedAt` TIMESTAMP 
ON UPDATE CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP


--------------------

ALTER TABLE `votes` ADD `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

ALTER TABLE `votes` ADD `updatedAt` TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP



NOT NULL


alter table votes add column updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

CREATE TABLE t1 (
  ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  dt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


ALTER TABLE posts ADD FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

INSERT INTO votes SET postId = 1, createdAt = null, userId = 1, vote = 1 ON DUPLICATE KEY UPDATE vote = 1 

INSERT INTO votes SET postId = 1, createdAt = null, userId = 1, vote = -1 ON DUPLICATE KEY UPDATE vote = -1 



INSERT INTO votes SET postId = 1, userId = 1, vote = -1 ON DUPLICATE KEY UPDATE vote = -1 
INSERT INTO votes SET postId = 2, createdAt = null, userId = 1, vote = 0 ON DUPLICATE KEY UPDATE vote = 0 


ALTER TABLE Chicken ADD COLUMN (breedId INT, FOREIGN KEY (breedId) REFERENCES Breed(breedId));


CREATE TABLE sessions (
id INT auto_increment PRIMARY KEY, 
userId INT, 
token VARCHAR(200))


INSERT INTO sessions
            SET 
            userId = 2,
            token = 'xxxxxx111111122222223'

INSERT INTO `tags` (`tag`) VALUES ('myvalue1')
  ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id), `tag`='myvalue1';
SELECT LAST_INSERT_ID();


SELECT sessions.userId, sessions.token, users.userId, users.username
FROM sessions
JOIN users
ON sessions.userId=users.userId
WHERE sessions.token= REQUEST.TOKEN



SELECT sessions.userId, sessions.token, users.id, users.username
FROM sessions
JOIN users
ON sessions.userId=users.id
WHERE sessions.userId = 16



ALTER TABLE sessions ADD UNIQUE userId


SELECT token
FROM sessions
WHERE
userId = 16







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


// ------------------------------------------------------------------------------------
app.get('/hello/', function(req, res) {
    res.send('<h1>Hello World!</h1>');
});


// ------------------------------------------------------------------------------------
app.get('/hello/:name', function(req, res) {
    var name = req.params.name
    res.send('<h1>Hello ' + name + '!</h1>');
});

// ------------------------------------------------------------------------------------
// add *? after parameter to make it optional
app.get('/calculator/:operator*?', function(req, res) {
    var num1 = Number(req.query.num1);
    var num2 = Number(req.query.num2);
    var op = req.params.operator;

    // if user doesnt enter an operator, send an error and message
    if (!req.params.operator) {
        res.status(400).send({
            error: "you need to enter an operator 'add', 'sub', 'mult' or 'div'."
        })
        return;
        // need to return to stop function here
    }

    if (op === 'add') {
        var sol = num1 + num2;
    }
    else if (op === 'sub') {
        var sol = num1 - num2;
    }
    else if (op === 'mult') {
        var sol = num1 * num2;
    }
    else if (op === 'div') {
        var sol = num1 / num2;
    }
    else {
        return res.status(400).send({
            error: "Operator " + op + " does not exist"
        });
    }

    var output = {
        operator: op,
        firstOperand: num1,
        secondOperand: num2,
        solution: sol
    };

    res.send(JSON.stringify(output));
});



