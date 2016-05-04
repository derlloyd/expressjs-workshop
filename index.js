var express = require('express');
var app = express();
var mysql = require('mysql');

var bodyParser = require("body-parser")
app.use(bodyParser());

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'derlloyd',
  password: '',
  database: 'reddit'
})

var creddit = require('./creddit');
var credditAPI = creddit(connection);

var bcrypt = require('bcrypt')
var secureRandom = require('secure-random')
var cookieParser = require('cookie-parser')
app.use(cookieParser())

// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------
// function getSinglePost(postId, callback) {

//   // if blank userId is passed, do not add WHERE condition,return all posts
//   // userId set to "" if doesnt exist in get function below
//   var postIdString
  
//   if (postId === "") {
//     postIdString = "";
//   }
//   else {
//     postIdString = "WHERE posts.id =" + postId;
//   }
//   // console.log("POSTID----------------------", postId)
//   // console.log("POSTID STRING----------------------", postIdString)
  
//   connection.query(`
//   SELECT posts.id AS id, posts.title AS title, posts.url AS url, posts.userId AS userId, posts.createdAt AS createdAt, users.username AS username
//   FROM posts 
//   JOIN users
//   ON posts.userId=users.id
//   ${postIdString}
//   `, function(err, results) {
//     if (err) {
//       callback(err)
//     }
//     else {
//       callback(null, results)
//     }
//   })
// }

// ------------------------------------------------------------------------------------
// function getPosts(userId, callback) {

//   // if blank userId is passed, do not add WHERE condition,return all posts
//   // userId set to "" if doesnt exist in get function below
//   var userIdString
//   if (userId === "") {
//     userIdString = "";
//   }
//   else {
//     userIdString = "WHERE userId =" + userId;
//   }

  
//   connection.query(`
//   SELECT posts.id AS id, posts.title AS title, posts.url AS url, posts.userId AS userId, posts.createdAt AS createdAt, users.username AS username
//   FROM posts 
//   JOIN users
//   ON posts.userId=users.id
//   ${userIdString}
//   ORDER BY createdAt 
//   DESC LIMIT 20
//   `, function(err, results) {
//     if (err) {
//       callback(err)
//     }
//     else {
//       callback(null, results)
//     }
//   })
// }

// // ------------------------------------------------------------------------------------
// function createPosts(title, url, userId, callback) {
//   // assumes subredditId is 2
//   var dbQuery = `
//   INSERT INTO posts 
//   (title, url, userId, createdAt, subredditId)
//   VALUES
//   ('${title}', '${url}', '${userId}', null, 2)
//   `
  
//   connection.query(dbQuery, function(err, results) {
//     if (err) {
//       callback(err);
//     }
//     else {
//       callback(null, results);
//     }
//   })
// }

// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------

app.use(function(request, response, next) {
  // this will run EVERY time there is a web request, could set cookies here
  
  // console.log(request.headers);
  // callback next to indicate that finished
  next();
})

// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------

app.get('/', function(req, res) {
  res.sendFile('/home/ubuntu/workspace/index.html');
  
  // res.send('<h1>Hello World!</h1>');
});

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

// ------------------------------------------------------------------------------------
app.get('/post/:postId', function(request, response) {
  
  var id = request.params.postId
  console.log("ID--------------------", id);
  // getSinglePost(id, function(err, results) {
  credditAPI.getSinglePost(id, function(err, results) {
    
    if (err) {
      console.log(err)
      response.status(500).send({error: "server error"})
      // error
    }
    else {
      // send html string result to user
      // console.log("REUSLTS-------------------", results[0])
      // console.log("REUSLTS url-------------------", results[0].url)
      
      
      var htmlString = `
        <div id="contents">
          <h1>Post ${results[0].posts_id}</h1>
          <ul class="contents-list">
            <li class="content-item">
              <h2 class="content-item__title">
                <a href="${results[0].posts_url}">${results[0].posts_title}</a>
              </h2>
              <p>Created by ${results[0].users_username}</p>
              <p>Created ${results[0].posts_createdAt}</p>
            </li>
          </ul>
        </div>`

        response.send(htmlString)
      
    }
  })
})



// ------------------------------------------------------------------------------------
app.get('/posts/:userId*?', function(req, res) {
  
  // to return multiple posts by user
  var id
  // if user doesnt enter a userId, set userId as ""
  // this "" will be passed to function getPosts
  if (!req.params.userId) {
    id = "";
  }
  else {
    id = req.params.userId
  }

  // var id = req.params.userId;
  // console.log("THIS IS ID-------------", id)
  // getPosts(id, function(err, posts) {
  credditAPI.getAllPostsForUser(id, function(err, posts) {
  // OPTIONS PER PAGE ARE DEFINED IN THIS Fn

    if (err) {
      // 500 is a server error, query didnt work
      res.status(500).send('Query failed');
    }
    else {
      if (posts.length === 0) {
        res.send("User has no posts");
      }
      else {
        // main output of html on success
        // console.log("POSTS------------xxxxxxxxxxxxxxxxxxx--------------", posts)
        var htmlString = ""
        // start with an empty string

        // concatenate li strings, adding info about each post
        posts.forEach(function(obj) {
          htmlString = htmlString + `
            
            <li class="content-item">
              <h2 class="content-item__title">
                  <a href="${obj.posts_url}">${obj.posts_title}</a>
              </h2>
                  <p>Created ${obj.posts_createdAt}</p>
            </li>`
        })

        // concatenate string by adding header and footer info
        htmlString = `
         <div id="contents">
            <h1>List of Posts by ${posts[0].users_username}</h1>
            <ul class="contents-list">` + htmlString +
          `</ul></div>`;
        // console.log("HTML STRING-------------------------------------", htmlString);
        res.send(htmlString)
      };
    }
  })
});


// ------------------------------------------------------------------------------------
app.get('/createContent/', function(request, response) {
  response.sendFile('/home/ubuntu/workspace/form.html');
  // when user types in url, they go to form.html
})
  

// ------------------------------------------------------------------------------------
app.get('/login', function(request, response) {
  response.sendFile('/home/ubuntu/workspace/login.html');
  // when a user types /login after url, go to login.html
  
})

// ------------------------------------------------------------------------------------
function checkLogin(userId, pwd, callback) {
  var dbQuery = `
    SELECT * 
    FROM users 
    WHERE id = ${userId}
    `
  console.log("EXECUTING CHECKLOGIN----------------------------------")
  
  connection.query(dbQuery, function(err, results) {
  
  console.log("IN EXECUTING CHECKLOGIN----------------------------------")
  console.log(err, results);
  
    if (results.length === 0) {
      console.log("ERROR----------------------", err)
        // error message query had no result
      callback(new Error('username or password incorrect'));
      return;
    }
    else {
      // now we have resulting user info, need to validate password
      var user = results[0]; // all info for given userId
      console.log("RETRIEVED INFO========================", user)
      var actualUserPwd = results[0].password || ""; // actual pwd stored in the database
  
      console.log("RETRIEVED PASSWORD========================", actualUserPwd)
      console.log("FORM PASSWORD========================", pwd)
  
      bcrypt.compare(pwd, actualUserPwd, function(err, result) {
        console.log("bcrypt result===============", result)
        if (result === true) {
          // password match true, return all user info
          callback(null, user)
        }
        else {
          callback(new Error('password wrong'));
        }
  
      })
  
    }
  })
  
}
  
// ------------------------------------------------------------------------------------

app.post('/login', function(request, response) {
// post login.html form, if ok, go to homepage index.html
  var id = request.body.id;
  var pwd = request.body.password;

  // console.log(id, pwd, "now calling checkLogin function");
  
  checkLogin(id, pwd, function(err, result) {
  
  console.log("THIS IS ERR FROM FN=======================", err);
  console.log("THIS IS RESULT FROM FN=======================", result);
  
  
  if (err) {
    console.log(err);
    response.send("did not work")
  }
  else {
    console.log(result);
    response.send(result)
  }
    
  })
  
})




// ------------------------------------------------------------------------------------
app.post('/createContent/', function(request, response) {
  // once at form.html, they can post request
  //execute createPost function
  console.log("REQUEST FORM-------", request.body.url, request.body.title)
  // console.log("CREATE CONTENT ---------------------")
  
  var post = {
    title: request.body.title,
    url: request.body.url,
    subredditId: 2, // for now
    userId: 2 // for now, mame the userIr1
  }
  
  // call createPost function to insert post then return value of that post
  credditAPI.createPost(post, function(err, result) {
    if (err) {
      console.log(err);
      // response.status(500).send("query failed");
      response.send("query failed");
      
      // result.send(err);
    }
    else {
      // then redirect to posts page for user
      
      response.redirect('/post/'+result.id);

    }
  })
  
})







// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------

/* YOU DON'T HAVE TO CHANGE ANYTHING BELOW THIS LINE :) */

// Boilerplate code to start up the web server
var server = app.listen(process.env.PORT, process.env.IP, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
