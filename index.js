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

// ------------------------------MIDDLEWARE--------------------------------------------
// ------------------------------------------------------------------------------------

app.use(function(request, response, next) {
    // this will run EVERY time there is a web request, could set cookies here

    // console.log(request.headers);
    // callback next to indicate that finished
    next();
})

// ------------------------------GETS AND POSTS----------------------------------------
// ------------------------------------------------------------------------------------

app.get('/', function(req, res) {
    res.sendFile('/home/ubuntu/workspace/index.html');

});

// ------------------------------------------------------------------------------------
app.get('/post/:postId', function(request, response) {

    var id = request.params.postId
    console.log("ID--------------------", id);
    // getSinglePost(id, function(err, results) {
    credditAPI.getSinglePost(id, function(err, results) {

        if (err) {
            console.log(err)
            response.status(500).send({
                    error: "server error"
                })
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
                res.send(htmlString)
            };
        }
    })
});


// ------------------------------------------------------------------------------------
app.get('/createContent/', function(request, response) {
    response.sendFile('/home/ubuntu/workspace/makepost.html');
    // when user types in url, they go to makepost.html
})


// ------------------------------------------------------------------------------------
app.post('/createContent/', function(request, response) {
    // once at makepost.html, they can post request
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

            response.redirect('/post/' + result.id);

        }
    })

})



// ------------------------------------------------------------------------------------
app.get('/login', function(request, response) {
    response.sendFile('/home/ubuntu/workspace/login.html');
    // when a user types /login after url, go to login.html

})

// ------------------------------------------------------------------------------------

app.post('/login', function(request, response) {
    // post login.html form, if ok, go to homepage index.html
    var username = request.body.username;
    var pwd = request.body.password;

    // console.log(id, pwd, "now calling checkLogin function");

    credditAPI.checkLogin(username, pwd, function(err, result) {

        if (err) {
            console.log("userame or password incorrect");
            response.send("username or password incorrect - try again")
            // redirect user back to login page
        }
        else {
            console.log(result);
            response.send(result)
            // if login is ok, redirect user to a list of their posts
        }

    })

})

// ------------------------------------------------------------------------------------

app.get('/signup', function(request, response) {
    response.sendFile('/home/ubuntu/workspace/signup.html')
        // load signup html file
})

// ------------------------------------------------------------------------------------

app.post('/signup', function(request, response) {
    var user = {
        username: request.body.username,
        password: request.body.password
    }

    credditAPI.createUser(user, function(err, result) {
        if (err) {
            console.log("ERROR after createUser--------------------", typeof err)
            response.send("User already exists") // redirect to try again
        }
        else {
            console.log("RESULT after createUser------------------------------", result)
            response.send("all good")
                // redirect to some other page
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
