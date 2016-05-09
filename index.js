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

app.use(express.static("css"));

// ------------------------------MIDDLEWARE--------------------------------------------
// ------------------------------------------------------------------------------------

app.use(function(request, response, next) {
    // this will run EVERY time there is a web request, could set cookies here

    // console.log("REQUEST.HEADER====================================", request.headers);

    // set default values for page display options, can be changed by user
    if (!request.displayOptions) {
        
        var displayOptions = {
            numPerPage: 10,
            page: 0 
        }
    
        request.displayOptions = displayOptions;
    }

    // set cookie values
    if (!request.cookies.SESSION) {
        console.log("there is no session======================")
            // no session either means that user has never logged in
            // OR could mean that user had deleted his cookie
            // user will get another cookie with same session store in db when they log in or sign up again

        next()
    }
    else {

        // console.log("REQUEST.COOKIES.session================================", request.cookies.SESSION);
        // query db using session to see if user exists, 
        // if yes, then add id and username tor equest object

        // stored session/token in user cookies that refers to a userId
        var currentSession = request.cookies.SESSION;
        // console.log("CURRENTSESSION=========================", currentSession)

        credditAPI.getUserInfoFromSession(currentSession, function(err, result) {
            // returns (null, false) or (null, result object) with user info, should be no err
            // console.log("MIDDLEWARE rerutn==========8888888888888============", result)

            if (!result === false) {
                request.loggedInUser = result;
                // console.log("MIDDLEWARE request.loggedInUser==========8888888888888============", request.loggedInUser)
                next()
                
            }
        })
    }

    // callback next to indicate that finished
    // next();

})

// ------------------------------REQUEST HANDLERS--------------------------------------
// ------------------------------------------------------------------------------------

app.get('/', function(req, res) {
    // MAIN PAGE, if user logged in, pass info to render function which will
    // display custom header
    

    // var userId = req.loggedInUser ? req.loggedInUser.userId : "";
    // var username = req.loggedInUser ? req.loggedInUser.users_username : "";
    
    // res.send(credditAPI.renderLayout("All posts", credditAPI.getAllPosts(), userId, username));
    
    res.redirect('/allposts');

});

// ------------------------------------------------------------------------------------
app.get('/post/:postId', function(request, response) {

    var id = request.params.postId
        // console.log("POST ID--------------------", id);
        // getSinglePost(id, function(err, results) {
    credditAPI.getSinglePost(id, function(err, results) {

        if (err) {
            console.log(err)
            response.status(500).send({
                    error: "server error"
                })
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
                  <!-- <p>Created by ${results[0].users_username}</p>
                  <p>Created ${moment(results[0].posts_createdAt).fromNow()}</p> -->
                </li>
              </ul>
            </div>
            <form action="/" method="GET"> 
              Good Job!
                <button type="submit">Back to Homepage</button>
            </form>
            
            `

        response.send(htmlString)


    })
})



// ------------------------------------------------------------------------------------
app.get('/posts/:userId*?', function(req, res) {

    var userId = req.loggedInUser ? req.loggedInUser.users_id : "";
    var username = req.loggedInUser ? req.loggedInUser.users_username : "";

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
    console.log("/POSTS---------id-------------", id)
        // var id = req.params.userId;
        // getPosts(id, function(err, posts) {
    
    
    credditAPI.getAllPostsForUser(req.loggedInUser.users_id, function(err, posts) {
        // OPTIONS PER PAGE ARE DEFINED IN THIS Fn
        console.log("POSTS RESULT============================", posts)
        console.log("POSTS ERR============================", err)
        if (err) {
            // 500 is a server error, query didnt work
            // res.status(500).send('Query failed');
                res.send("query error on server, unusual");
            
        }
        else {
            if (posts.length === 0) {
                 htmlString = `
                    <form action="/createContent" method="GET"> 
                        <div>
                            You have no posts yet.
                        </div>
                    <button type="submit">Create a POST</button>
                    </form>
                    `;
                res.send(credditAPI.renderLayout("Get Started", htmlString, userId, username));
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
                        <ul class="contents-list">` + htmlString +
                    `</ul></div>
                    <form action="/" method="GET"> 
              
                        <button type="submit">Back to Homepage</button>
                    </form>
                    `;
                res.send(credditAPI.renderLayout(`All posts for ${username}`, htmlString, userId, username));
                // res.send(htmlString)
            };
        }
    })
});



// ------------------------------------------------------------------------------------
app.get('/allposts', function(req, res) {

    var userId = req.loggedInUser ? req.loggedInUser.users_id : "";
    var username = req.loggedInUser ? req.loggedInUser.users_username : "";

    // OPTIONS for number of posts per page and current page are in this API function
    credditAPI.getAllPosts(req.displayOptions, function(err, posts) {
        // OPTIONS PER PAGE ARE DEFINED IN THIS Fn
        console.log("POSTS RESULT============================", posts)
        console.log("POSTS ERR============================", err)
        
        if (err) {
            // query error
            res.send(credditAPI.renderLayout("All posts", "Query Error, please try again later", userId, username))
        }
        else {
            if (posts.length === 0) {
                // no posts on the entire site, return empty html
                res.send(credditAPI.renderLayout("All posts", "No posts exist yet", userId, username))
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
                              <a href="${obj.url}">${obj.title}</a>
                          </h2>
                              <p>Created by ${obj.users.username}</p>
                              <p>Created ${moment(obj.createdAt).fromNow()}</p>
                        </li>`
                })

                // concatenate string by adding header and footer info
                // add CHANGE PAGE FUNCTIONALITY--------------------------------------------------------------***** AJAX
                // add CHANGE POSTS PER PAGE FUNCTIONALITY----------------------------------------------------***** AJAX
                var htmlStr = `
                     <div id="contents">
                        <p>
                        <a href=""><--</a>
                        page ${req.displayOptions.page + 1}
                        <a href="">--></a></p>
                        
                        <p>posts per page ${req.displayOptions.numPerPage}</p>
                        
                        <ul class="contents-list">` + htmlString +
                    `</ul></div>
                    `;
                    // console.log("HTML STRING========================", htmlString)
                res.send(credditAPI.renderLayout("All posts", htmlStr, userId, username))  // master send*******************
            };
        }
    })
});

// ------------------------------------------------------------------------------------
app.get('/createContent/', function(request, response) {
    // form where user creates a post
    // modify to add subreddit drop down button
    
    var userId = request.loggedInUser ? request.loggedInUser.users_id : "";
    var username = request.loggedInUser ? request.loggedInUser.users_username : "";
    
    var html = `
        <form action="/createContent" method="POST"> 
      <div>
        <input type="text" name="url" placeholder="Enter a URL to content">
      </div>
      <div>
        <input type="text" name="title" placeholder="Enter the title of your content">
      </div>
      <div>
        <input type="text" name="subreddit' placeholder="Fixed at 2 for now">
      </div>
      <button type="submit">Create!</button>
    </form>
    
    <form action="/" method="GET"> 
                  
      <button type="submit">Cancel</button>
    </form>
    `
    
    response.send(credditAPI.renderLayout("Create Post", html, userId, username));
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
        subredditId: 2, // for now *********************************************************************
        userId: request.loggedInUser.users_id
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
          <button type="submit">Cancel</button>
        </form>
    `
    
    response.send(credditAPI.renderLayout("Login", htmlStr));
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
            // for some reason, not able to login

            var htmlStr = `
            <form action="/login" method="GET"> 
              <div>
                Username or password error.
              </div>
              <button type="submit">Try again</button>
            </form>
            
            <form action="/" method="GET"> 
              
              <button type="submit">Cancel</button>
            </form>
        `

            response.send(credditAPI.renderLayout("Oops", htmlStr));
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

            console.log("CREATE SESSION ERR=========================", err)
            console.log("CREATE SESSION RESULT=========================", result)
            if (err) {
                // unable to create session, probably because user already has
                // a token entry in the sessions table
                // not their first time loggin in
                // no problem, send them to homepage

                // -- FUTURE TROUBLESHOOTING --
                // [Error: ER_DUP_ENTRY:
                // User and session may exist but user may have deleted cookies
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
              <button type="submit">Cancel</button>
            </form>
    `

    response.send(credditAPI.renderLayout("Signup", htmlStr));
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
                User already exists.
              </div>
              <button type="submit">Try again</button>
            </form>
            
            <form action="/" method="GET"> 
              <div>
                Back to homepage
              </div>
              <button type="submit">Cancel</button>
            </form>
        `

            response.send(credditAPI.renderLayout("Oops", htmlStrTryAgain)); // redirect to try again
        }
        else {

            console.log("RESULT after createUser------------------------------", result)
                // object with id, username etc...

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

            // all good so far, create token here and add it to the cookie
            credditAPI.createSession(result.id, function(err, result) {
                if (err) {
                    response.redirect('/');
                }
                else {
                    console.log("RESPONSE FROM CREATE SESSIOON=========", result);

                    response.cookie('SESSION', result);
                    response.redirect('/')

                }

            })

            // redirect to homepage
        }

    })

}),


// ------------------------------------------------------------------------------------

app.get('/logout', function(request, response) {
    // this only clears the cookie, the session still exists in the db
    
    response.clearCookie('SESSION');
    response.redirect('/');
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
