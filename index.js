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
var moment = require('moment')

// ------------------------------MIDDLEWARE--------------------------------------------
// ------------------------------------------------------------------------------------

app.use(function(request, response, next) {
    // this will run EVERY time there is a web request, could set cookies here

    console.log("REQUEST HEADER====================================", request.headers);
    console.log("REQUEST COOKIES session================================", request.cookies.SESSION);
    // query db using token to see if user exists, 
    // if yes, then add id and username tor equest object
    var currentSession = request.cookies.SESSION;
    
    
    
    
    
    
    
    // callback next to indicate that finished
    next();
})

// ------------------------------REQUEST HANDLERS--------------------------------------
// ------------------------------------------------------------------------------------

app.get('/', function(req, res) {
    
    var thisSession = req.cookies.SESSION || "";  // if no cookie, empty string so search still works
    // console.log("THIS SESSION============================================", thisSession);
    
    credditAPI.getUserInfoFromSession(thisSession, function(err, result) {
        // returns (null, false) or (null, result object) with user info
    
    // console.log("RESULTS OF QUERY=================================", result)
    
    // if cookies exist, log user in and show 2 extra buttons in header:
    // add posts and show my posts
    if (result === false) {
        // html login or signup
        var customHeadHtml = `
            <form action="/signup" method="GET"> 
              <div>
                Signup to create an account.
              </div>
              <button type="submit">Signup</button>
            </form>
            
            <form action="/login" method="GET"> 
              <div>
                Login to your account
              </div>
              <button type="submit">Login</button>
            </form>
        `    
    }
    else {
        // html welcome name, add posts or show my posts
        
        var customHeadHtml = `
            <form action="/signup" method="GET"> 
              <div>
                Signup to create an account.
              </div>
              <button type="submit">Signup</button>
            </form>
            
            <form action="/login" method="GET"> 
              <div>
                Login to your account
              </div>
              <button type="submit">Login</button>
            </form>
        `    
        
        
        
        
        
        
        
        
        
        
        
        var customHeadHtml = "WELCOME " + result.users_username + "!";  
    }
    
    // console.log("CUSTOM TEXT======================================", customHeadHtml)
    // console.log("CUSTOM TEXT======================================", result)
    
    var topHtml =
    `<html>
    <head>
    <title>Reddit clone</title>    
    </head>
    <body>`
        
    var headHtml =
    `
    <div id="header">
        ${customHeadHtml}
        </div>
    `
    // need to send user body html on this page, showing all posts
    var bodyHtml =
    `<div id="content">
        <h1>
        Welcome to reddit clone
        </h1>
        
        This is normally where all posts are listed.
        </div>
        
        </body>
    </html>
    `
    
    // concat all html together
    var sendHtml = topHtml + headHtml + bodyHtml
    res.send(sendHtml);
    
    
    
    
    })
});

// ------------------------------------------------------------------------------------
app.get('/post/:postId', function(request, response) {

    var id = request.params.postId
    // console.log("POST ID--------------------", id);
    // getSinglePost(id, function(err, results) {
    credditAPI.getSinglePost(id, function(err, results) {

        if (err) {
            console.log(err)
            response.status(500).send({error: "server error"})
                // error
        }
        
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
                  <p>Created ${moment(results[0].posts_createdAt).fromNow()}</p>
                </li>
              </ul>
            </div>`

        response.send(htmlString)

        
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
                              <p>Created ${moment(obj.posts_createdAt).fromNow()}</p>
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
    
    var htmlStr = `
        <h1>LOGIN PAGE</h1>
        <form action="/login" method="POST"> 
          <div>
            <input type="text" name="username" placeholder="Enter your username">
          </div>
          <div>
            <input type="password" name="password" placeholder="Enter your password">
          </div>
          <button type="submit">Login</button>
        </form>
        
        <form action="/" method="GET"> 
              <div>
                Back to homepage
              </div>
              <button type="submit">Back to Homepage</button>
            </form>
        
        
    `

    response.send(htmlStr);
    // when a user types /login after url, go to login.html

})

// ------------------------------------------------------------------------------------

app.post('/login', function(request, response) {
    // post login.html form, if ok, go to homepage index.html
    var username = request.body.username;
    var pwd = request.body.password;
    

    credditAPI.checkLogin(username, pwd, function(err, result) {
        // this function will return either (null, false) or (null, user Object)
        // shouldnt really return err
        
        console.log("CREDITAPI checklogin result======================", result)

        if (err) {
            // checklogin should always return a result, if not, there is some server error
            response.status(500).send("an error occured, please try again later")
            // user can hit back or refresh
        }
        
        if (result === false) {
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            response.redirect('/')
            return;
        }
        
        console.log("RESULT OF checklogin function=================", result.id);
        // login is OK, first create and post token
        // then send token back to user through cookies
        // then redirect user to a list of their posts
        
        var retId = result.id
        // invoke this session after login returns the userId

        credditAPI.createSession(retId, function(err, result) {
        // if all was ok, result of this is (null, token)
        // need to do function(err, result) {send cookie}
            if (err) {
                // unable to create session, probably because user already has
                // a token entry in the sessions table
                // not their first time loggin in
                // no problem, send them to homepage
                response.redirect('/');
            }
            else {
                // first time login, give user token as a cookie
                response.cookie('SESSION', result);
                response.redirect('/');
            }
        })
            
        
        
        // if login is ok, redirect user to a list of their posts
            
            
        

    })

})

// ------------------------------------------------------------------------------------

app.get('/signup', function(request, response) {
    
    var htmlStr = `
        <h1>SIGNUP PAGE</h1>
        <form action="/signup" method="POST"> 
          <div>
            <input type="text" name="username" placeholder="Create your username">
          </div>
          <div>
            <input type="password" name="password" placeholder="Create a password">
          </div>
          <button type="submit">Sign me up!</button>
        </form>
        <form action="/" method="GET"> 
              <div>
                Back to homepage
              </div>
              <button type="submit">Back to Homepage</button>
            </form>
        
        
    `
    
    response.send(htmlStr)
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
            console.log("ERROR after createUser--------------------", err)
            
            var htmlStrTryAgain = `
            <form action="/signup" method="GET"> 
              <div>
                User already exists, please try again.
              </div>
              <button type="submit">Back to Signup</button>
            </form>
            
            <form action="/" method="GET"> 
              <div>
                Back to homepage
              </div>
              <button type="submit">Back to Homepage</button>
            </form>
        `    
            
            response.send(htmlStrTryAgain) // redirect to try again
        }
        else {
            
            console.log("RESULT after createUser------------------------------", result)
            
            // this would make the user have to login after signing up
        //     var htmlStr = `
        //     <form action="/login" method="GET"> 
        //       <div>
        //         Account created, please login:
        //       </div>
        //       <button type="submit">Login</button>
        //     </form>
        // `   
            // response.send(htmlStr)
            
            response.cookie('SESSION', result);
            response.redirect('/')
                // redirect to homepage
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
