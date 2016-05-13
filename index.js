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

app.use(express.static("public"));

var request = require('request');

// ------------------------------MIDDLEWARE--------------------------------------------
// ------------------------------------------------------------------------------------

app.use(function(request, response, next) {
    // this will run EVERY time there is a web request, could set cookies here

    // console.log("REQUEST.HEADER====================================", request.headers);

    // set default values for page display options, can be changed by user
    if (!request.displayOptions) {
        
        var displayOptions = {
            sortAllPosts: "hot",
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

})

// ------------------------------REQUEST HANDLERS--------------------------------------
// ------------------------------------------------------------------------------------

app.get('/', function(req, res) {
    
    res.redirect('/allposts');

});

// ------------------------------------------------------------------------------------
app.get('/post/:postId', function(request, response) {


    var userId = request.loggedInUser ? request.loggedInUser.users_id : "";
    var username = request.loggedInUser ? request.loggedInUser.users_username : "";


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
                  <p>Created at ${moment(results[0].posts_createdAt).format("h:mm a")}</p>
                </li>
              </ul>
            </div>
            
        <form action="/vote" method="POST"> 
            <input type="text" name="postId" value=${results[0].posts_id}>
            <input type="text" name="userId" value=${userId}>
            <input type="text" name="vote" value='1'>
          <button type="submit">UPVOTE</button>
        </form>
        
        <form action="/vote" method="POST"> 
            <input type="text" name="postId" value=${results[0].posts_id}>
            <input type="text" name="userId" value=${userId}>
            <input type="text" name="vote" value='-1'>
          <button type="submit">DOWNVOTE</button>
        </form>
            
            <button><a href="/" style="text-decoration:none">Back</a></button>
            `
        response.send(credditAPI.renderLayout(`New post`, htmlString, userId, username));

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
        // console.log("POSTS RESULT============================", posts)
        // console.log("POSTS ERR============================", err)
        if (err) {
            // 500 is a server error, query didnt work
            // res.status(500).send('Query failed');
                res.send("query error on server, unusual");
            
        }
        else {
            if (posts.length === 0) {
                 htmlString = `
                    <form class="newpost-form" action="/createContent" method="GET"> 
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
                        <button><a href="/">Back</a></button>
                    `;
                
                res.send(credditAPI.renderLayout(`All posts for ${username}`, htmlString, userId, username));
                // res.send(htmlString)
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
    <form class="newpost-form" action="/createContent" method="POST"> 
      <div>
        <input class="the-url" type="text" name="url" placeholder="Enter a URL to content">
      </div>
    <button class="suggest-title" type="button">suggest title</button>
      <div>
        <input class="the-title" type="text" name="title" placeholder="Enter the title of your content">
      </div>
      <div class=spinner></div>
      <div>
        <input class="the-sub" type="text" name="subreddit" placeholder="Fixed at 2 for now - MAKE DROPDOWN OR FORM FILE">
      </div>
      <button type="submit">Create!</button>
    </form>
    
    <button><a href="/" style="text-decoration: none">Cancel</a></button>
    <script>
        console.log("WITHIN CREATE CONTENT")
    
        function createContentScript() {
          $('.the-title').val('xyz123');  
    }
    
    
    </script>
    
    `
    // don't need to call jquery here because it is being called before the footer of the main html
    // function is being called when document ready
    // <script src="https://code.jquery.com/jquery-1.12.3.js"></script>
    
    response.send(credditAPI.renderLayout("Create Post", html, userId, username));
    // when user types in url, they go to makepost.html
});



// ------------------------------------------------------------------------------------
app.get('/allposts', function(req, res) {
// if user enters ?sort=value after url, key value pair stored in request
    var userId = req.loggedInUser ? req.loggedInUser.users_id : "";
    var username = req.loggedInUser ? req.loggedInUser.users_username : "";
    
    // user can enter a search argument after the res path, value is store as req.query.sort
    // console.log("REQUEST QUERY=========================================================",req.query)
    // default sortMethod is stored in the global request header from the middleware req.displayOptions.sortAllPosts
    // console.log("PREVIOUS GLOBAL DISPLAY OPTION==================================================",req.displayOptions.sortAllPosts)
    // if a sort path is entered that corresponds to sorting method, change global request header
    // and call getAllPosts function with that sortingMethod
    
    var displaySorted = "sorted by "+req.displayOptions.sortAllPosts;
    if (req.query.sort === "new") {
        var sortBy = "new";
        displaySorted = "sorted by new";
        req.displayOptions.sortAllPosts = "new";
    } 
    else if (req.query.sort === "hot") {
        var sortBy = "hot";
        displaySorted = "sorted by hot";
        req.displayOptions.sortAllPosts = "hot";
    } 
    else {
        // if no sort value specified, or if an unmatched sort value entered
        // use the one saved in the header
        var sortBy = req.displayOptions.sortAllPosts
    }
    
    // if user entered a query filter for subreddit or to show only posts for a certain user
    // create a filter object and pass it to function
    var filter = {}
    var displayFilter = ""
    if (req.query.subreddit) {
        filter.subreddit = req.query.subreddit;
        displayFilter = "  filtered by subreddit"
    }
    if (req.query.user) {
        filter.user = req.query.user;
        displayFilter = "filtered by user"
    }
    // console.log("FILTER''''''''''''''''''''==================", filter)
    // console.log("================================================================")
    // console.log("NEW SORT METHOD================================================================", sortBy)
    // console.log("NEW GLOBAL DISPLAY OPTION==================================================",req.displayOptions.sortAllPosts)
    
    
    // OPTIONS for number of posts per page and current page are in this API function
    credditAPI.getAllPosts(req.displayOptions, sortBy, filter, function(err, posts) {
        // OPTIONS PER PAGE ARE DEFINED IN THIS Fn
        // console.log("POSTS RESULT============================", posts)
        // console.log("POSTS ERR============================", err)
        
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
                    
                                        // &#8679 8681 9947 10809other unicode arrows
                    
                // concatenate li strings, adding info about each post
                posts.forEach(function(obj) {
                    var voteCount = obj.voteScore ? obj.voteScore : "-";
                    htmlString = htmlString + `
            
                        <li class="content-item">
                            <ul class="content-boxes">
                                <li class="vote-box">
                                    
                                        <p><a href="" class="vote-up">&#8679</a></p>
                                        <p>${voteCount}</p>
                                        <p><a href="" class="vote-down">&#8681</a></p>
                                    
                                </li>
                                <li class="image-box">
                                        <a href="/post/${obj.id}"><img src="https://placekitten.com/g/100/100"/></a>                                    
                                    
                                </li>
                                <li class="info-box">
                                    <ul>
                                        <li>
                                        <h2 class="content-item__title">
                                            <a href="${obj.url}">${obj.title}</a>
                                        </h2>
                                        </li>
                                        <li><a href="/allposts?subreddit=${obj.subreddit.id}">/r/${obj.subreddit.name}</a></li>
                                        
                                        <li>
                                        <ul class="info-box-items">
                                            <li class="date"><p>Created ${moment(obj.createdAt).fromNow()}</p></li>
                                            <li class="created-by"><p>by ${obj.users.username}</p></li>
                                            <li class="post-id"><p>post:${obj.id} - (${obj.url})</p></li>
                                        </ul>
                                        </li>
                                    </ul>    
                                </li>
                            </ul>
                        </li>
                        `
                })

                // concatenate string by adding header and footer info
                // add CHANGE PAGE FUNCTIONALITY--------------------------------------------------------------***** AJAX
                // add CHANGE POSTS PER PAGE FUNCTIONALITY----------------------------------------------------***** AJAX
                
                var htmlStr = `
                        ${displaySorted}<br>
                        <a class="sort-options" href="/allposts?sort=hot">hot</a>
                        <a class="sort-options" href="/allposts?sort=new">new</a>
                        ${displayFilter}
                        <ul class="contents-list">` + htmlString +
                    `</ul>
                    
                     <div id="page-display-options">
                        <span>posts per page <a href="/postsperpage/">${req.displayOptions.numPerPage}</a>: </span>
                        <a href="">NEXT PAGE>></a>
                    </div>    
                    `;
                    // console.log("HTML STRING========================", htmlString)
                res.send(credditAPI.renderLayout("All posts", htmlStr, userId, username));
            };
        }
    })
});

// ------------------------------------------------------------------------------------
app.get('/postsperpage/', function(request, response) {
    
    // do something here that lets the user change the display options ************************************ TBD
    
    response.redirect('/allposts/');
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
        subredditId: 2, // for now ********************************************************************* TBD
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
        <form class="login-form" action="/login" method="POST"> 
          <div>
            <input type="text" name="username" placeholder="Enter your username">
          </div>
          <div>
            <input type="password" name="password" placeholder="Enter your password">
          </div>
          <button type="submit">Login</button>
        </form>
        <button><a href="/" style="text-decoration:none">Cancel</a></button>
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
            <form class="login-form" action="/login" method="GET"> 
              <div>
                Username or password error.
              </div>
              <button type="submit">Try again</button>
            </form>
            <button><a href="/" style="text-decoration:none">Cancel</a></button>
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
        <form class="signup-form" action="/signup" method="POST"> 
          <div>
            <input type="text" name="username" placeholder="Create your username">
          </div>
          <div>
            <input type="password" name="password" placeholder="Create a password">
          </div>
          <button type="submit">Sign me up!</button>
        </form>
        <button><a href="/" style="text-decoration:none">Cancel</a></button>
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

            <button><a href="/" style="text-decoration:none">Cancel</a></button>            
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

app.post('/vote', function(request, response) {
    
    var vote = {
        userId: request.body.userId,
        postId: request.body.postId,
        vote: request.body.vote
    }

    credditAPI.createOrUpdateVote(vote, function(err, result) {
        if (err) {
            console.log("ERROR after VOTE--------------------", err)

            var htmlStrTryAgain = `
            <p>Sign up or Login to vote</p>
            <button><a href="/" style="text-decoration:none">Back</a></button>            
        `

            response.send(credditAPI.renderLayout("Oops", htmlStrTryAgain)); 
            // if error, redirect to homepage with empty main area
        }
        else {
            // console.log("VOTE CREATE RESULT*********************************************", result)
            // console.log("VOTE CREATED------------------**********************************************")
            response.redirect('/');
            // redirect to homepage
        }

    })

})

app.get('/getTitle', function(req, res) {
    // when someone goes to main site/getTitle?url=xxxxx.com
    // url value is stored in request query as request.query.url, use req to not conflict with web request
    
    var url = req.query.url;
    
    // feed the url provided by user to request to get some info
    request(url, function(err, result) {
        if (err) {
            res.send("url error")
        }
        else {
            //if there's a result, this is the html body of the url
            var body = result.body;
            
            // feed html to this function to return the info between the title tags
            
            // set delay on return so that i can work on loading notifications
            setTimeout(function(){
                res.send(credditAPI.getTitleFromHtml(body))
            }, 2500)
            
            
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
