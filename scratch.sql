
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



