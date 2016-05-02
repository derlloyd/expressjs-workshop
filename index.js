var express = require('express');
var app = express();
var mysql = require('mysql');

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'derlloyd',
  password: '',
  database: 'reddit'
})

function getPosts(userId, callback){
  connection.query('SELECT * FROM posts WHERE userId=${userId}', function(err, results) {
    if (err) {
      callback(err)
    }
    else {
      callback(results)
    }
  })
}

app.listen();

app.get('/', function (req, res) {
  res.send('<h1>Hello World!</h1>');
});

app.get('/hello/', function (req, res) {
  res.send('<h1>Hello World!</h1>');
});


// app.get('/hello', function (req, res) {
app.get('/hello/:name', function (req, res) {
  // console.log(req.params.name)
  // var name = req.query.name
  var name = req.params.name
  res.send('<h1>Hello ' + name + '!</h1>');
});


app.get('/calculator/:operator', function (req, res) {
  var num1 = Number(req.query.num1);
  var num2 = Number(req.query.num2);
  var op = req.params.operator;

  
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
    return res.status(400).send("Operator does not exist");
  }
  
  var output = {
      operator: op,  
      firstOperand: num1,  
      secondOperand: num2,  
      solution: sol
  };

  res.send(JSON.stringify(output));
});


/* YOU DON'T HAVE TO CHANGE ANYTHING BELOW THIS LINE :) */

// Boilerplate code to start up the web server
var server = app.listen(process.env.PORT, process.env.IP, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
