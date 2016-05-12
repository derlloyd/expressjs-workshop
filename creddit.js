var bcrypt = require('bcrypt');
var HASH_ROUNDS = 10;
var secureRandom = require('secure-random')
var moment = require('moment')

module.exports = function CredditAPI(conn) {
    return {
        createUser: function(user, callback) {

            // first we have to hash the password...
            bcrypt.hash(user.password, HASH_ROUNDS, function(err, hashedPassword) {
                if (err) {
                    callback(err);
                }
                else {
                    conn.query(
                        'INSERT INTO `users` (`username`,`password`, `createdAt`) VALUES (?, ?, ?)', [user.username, hashedPassword, null],
                        function(err, result) {
                            if (err) {
                                /*
                                There can be many reasons why a MySQL query could fail. While many of
                                them are unknown, there's a particular error about unique usernames
                                which we can be more explicit about!
                                */
                                if (err.code === 'ER_DUP_ENTRY') {
                                    callback(new Error('A user with this username already exists'));
                                }
                                else {
                                    callback(err);
                                }
                            }
                            else {
                                console.log("USER CREATED --------------xxxRESULTxxxxxxx--------", result)
                                    /*
                                    Here we are INSERTing data, so the only useful thing we get back
                                    is the ID of the newly inserted row. Let's use it to find the user
                                    and return it
                                    */
                                conn.query(
                                    'SELECT `id`, `username`, `createdAt`, `updatedAt` FROM `users` WHERE `id` = ?', [result.insertId],
                                    function(err, result) {
                                        if (err) {
                                            callback(err);
                                        }
                                        else {
                                            /*
                                            Finally! Here's what we did so far:
                                            1. Hash the user's password
                                            2. Insert the user in the DB
                                            3a. If the insert fails, report the error to the caller
                                            3b. If the insert succeeds, re-fetch the user from the DB
                                            4. If the re-fetch succeeds, return the object to the caller
                                            */
                                            callback(null, result[0]);
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            });
        },
        createPost: function(post, callback) {
            console.log("RECEIVED POST INFO=============================", post)

            conn.query(
                'INSERT INTO `posts` (`userId`, `title`, `url`, `createdAt`, `subredditId`) VALUES (?, ?, ?, ?, ?)', [post.userId, post.title, post.url, null, post.subredditId],
                function(err, result) {

                    if (err) {
                        console.log("record not created")
                        callback(err);
                    }
                    else {
                        console.log("post created!!!!!!!!!!!!! ------------------", result)
                            /*
                            Post inserted successfully. Let's use the result.insertId to retrieve
                            the post and send it to the caller!
                            */
                        conn.query(
                            'SELECT * FROM `posts` WHERE `id` = ?', [result.insertId],
                            function(err, result) {

                                if (err) {
                                    callback(err);
                                }
                                else {
                                    callback(null, result[0]);
                                }
                            }
                        );
                    }
                }
            );
        },
        getAllPosts: function(options, sortingMethod, callback) {
            // In case we are called without an options parameter, shift all the parameters manually
            if (!callback) {
                callback = options;
                options = {};
            }
            var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
            var offset = (options.page || 0) * limit;

            // do we sort the posts by newest or highest vote count?
            if(sortingMethod === "new") {
                // sort by newest only
                var sort = " posts.createdAt DESC"
            }
            else if (sortingMethod === "hot") {
                // sort highest voteScore, then by date, default
                var sort = " voteScore DESC, posts.createdAt DESC" 
            } 
            else {
                // default = hot
                var sort = " voteScore DESC, posts.createdAt DESC" 
            }

            conn.query(`
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
        GROUP BY posts.id
        ORDER BY ${sort}
        LIMIT ? OFFSET ?
        `, [limit, offset],
                function(err, results) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        callback(null, results.map(function(obj) {
                            var rObj = {};
                            rObj.id = obj.posts_id;
                            rObj.title = obj.posts_title;
                            rObj.url = obj.posts_url;
                            rObj.createdAt = obj.posts_createdAt;
                            rObj.updatedAt = obj.posts_updatedAt;
                            rObj.userId = obj.posts_userId;
                            rObj.users = {}
                            rObj.users.id = obj.users_id;
                            rObj.users.username = obj.users_username;
                            rObj.users.createdAt = obj.users_createdAt;
                            rObj.users.updatedAt = obj.users_updatedAt;
                            rObj.subredditId = obj.posts_subredditId;
                            rObj.subreddit = {};
                            rObj.subreddit.id = obj.subreddit_id;
                            rObj.subreddit.name = obj.subreddit_name;
                            rObj.subreddit.description = obj.subreddit_description;
                            rObj.subreddit.createdAt = obj.createdAt;
                            rObj.subreddit.updatedAt = obj.updatedAt;
                            rObj.voteScore = obj.voteScore;
                            return rObj;
                        }));
                    }
                }
            );
        },
        getAllPostsForUser: function(userId, options, callback) {
            // In case we are called without an options parameter, shift all the parameters manually
            
            if (!callback) {
                callback = options;
                options = {};
            }
            var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
            var offset = (options.page || 0) * limit;

            var sqlQuery = `
        SELECT posts.id AS posts_id, posts.title AS posts_title, 
        posts.url AS posts_url, posts.createdAt AS posts_createdAt, 
        posts.updatedAt AS posts_updatedAt, posts.userId AS posts_userId,
        users.id AS users_id, users.username AS users_username, 
        users.createdAt AS users_createdAt, users.updatedAt AS users_updatedAt
        FROM posts
        JOIN users
        ON posts.userId=users.id
        WHERE users.id=${userId}  
        
        ORDER BY posts.createdAt DESC
        LIMIT ? OFFSET ?
        `
            conn.query(sqlQuery, [limit, offset],
                function(err, results) {
                    console.log("conn query result----------------------------------------", results)
                    console.log("conn query err----------------------------------------", err)


                    if (err) {
                        console.log("conn query if err----------------------------------------", err)

                        callback(err);
                    }
                    // else if (results.length === 0) {
                    //     console.log("conn query if err----------------------------------------", err)
                    //     console.log("User ID does not exist");
                    //     callback(err);
                    //     return;
                    // }
                    else {
                        // callback(results.map(function(obj) {
                        //   var rObj = {};
                        //   rObj.id = obj.posts_id;
                        //   rObj.title = obj.posts_title;
                        //   rObj.url = obj.posts_url;
                        //   rObj.createdAt = obj.posts_createdAt;
                        //   rObj.updatedAt = obj.posts_updatedAt;
                        //   rObj.userId = obj.posts_userId;
                        //   rObj.users = {}
                        //       rObj.users.id = obj.users_id;
                        //       rObj.users.username = obj.users_username;
                        //       rObj.users.createdAt = obj.users_createdAt;
                        //       rObj.users.updatedAt = obj.users_updatedAt;
                        //   return rObj;
                        // }));
                        // console.log("RESULT OF FUNCTON---------------xxxxxxxxxxxxxxx----------", results)
                        callback(null, results)

                    }
                }
            );
        },
        getSinglePost: function(postId, callback) {

            var sqlQuery = `
        SELECT posts.id AS posts_id, posts.title AS posts_title, 
        posts.url AS posts_url, posts.createdAt AS posts_createdAt, 
        posts.updatedAt AS posts_updatedAt, posts.userId AS posts_userId,
        users.id AS users_id, users.username AS users_username, 
        users.createdAt AS users_createdAt, users.updatedAt AS users_updatedAt
        FROM posts
        JOIN users
        ON posts.userId=users.id
        WHERE posts.id=${postId}  
        
        ORDER BY posts.createdAt DESC
        `
            conn.query(sqlQuery,
                function(err, results) {
                    // console.log("QUERY ERR=============================", err)
                    // console.log("QUERY RESULT TYPE=============================", typeof results)
                    // console.log("QUERY RESULT=============================", results)

                    if (err) {
                        callback(err);
                    }
                    else if (results.length === 0) {
                        console.log("Post ID does not exist");
                        callback(err)
                        return;
                    }
                    else {

                        // results.map(function(obj) {
                        //   var rObj = {};
                        //   rObj.id = obj.posts_id;
                        //   rObj.title = obj.posts_title;
                        //   rObj.url = obj.posts_url;
                        //   rObj.createdAt = obj.posts_createdAt;
                        //   rObj.updatedAt = obj.posts_updatedAt;
                        //   rObj.userId = obj.posts_userId;
                        //   rObj.users = {}
                        //       rObj.users.id = obj.users_id;
                        //       rObj.users.username = obj.users_username;
                        //       rObj.users.createdAt = obj.users_createdAt;
                        //       rObj.users.updatedAt = obj.users_updatedAt;
                        //   console.log("OBJECT Obj------------------------------", rObj)

                        // });
                        // console.log("OBJECT EXPORTED------------------------------", results[0]);
                        callback(null, results);

                    }
                }
            );
        },
        createSubreddit: function(sub, callback) {
            conn.query(
                'INSERT INTO `subreddits` (`name`, `description`, `createdAt`) VALUES (?, ?, ?)', [sub.name, sub.description, null],
                function(err, result) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        /*
                        sub inserted successfully. Let's use the result.insertId to retrieve
                        the sub and send it to the caller!
                        */
                        conn.query(
                            'SELECT `id`,`name`,`description`, `createdAt`, `updatedAt` FROM `subreddits` WHERE `id` = ?', [result.insertId],
                            function(err, result) {
                                if (err) {
                                    callback(err);
                                }
                                else {
                                    callback(result[0]);
                                }
                            }
                        );
                    }
                }
            );
        },
        getAllSubreddits: function(callback) {
            // In case we are called without an options parameter, shift all the parameters manually
            // if (!callback) {
            //   callback = options;
            //   options = {};
            // }
            // var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
            // var offset = (options.page || 0) * limit;

            conn.query(`
        SELECT subreddits.id AS subreddits_id, subreddits.name AS subreddits_name, 
        subreddits.description AS subreddits_description, subreddits.createdAt AS subreddits_createdAt, 
        subreddits.updatedAt AS subreddits_updatedAt
        FROM subreddits
        ORDER BY subreddits.createdAt DESC
        `,
                function(err, results) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        callback(results);
                        // callback(results.map(function(obj) {
                        //   var rObj = {};
                        //   rObj.id = obj.posts_id;
                        //   rObj.title = obj.posts_title;
                        //   rObj.url = obj.posts_url;
                        //   rObj.createdAt = obj.posts_createdAt;
                        //   rObj.updatedAt = obj.posts_updatedAt;
                        //   rObj.userId = obj.posts_userId;
                        //   rObj.users = {}
                        //       rObj.users.id = obj.users_id;
                        //       rObj.users.username = obj.users_username;
                        //       rObj.users.createdAt = obj.users_createdAt;
                        //       rObj.users.updatedAt = obj.users_updatedAt;
                        //   return rObj;
                        // }));
                    }
                }
            );
        },
        createComment: function(comment, callback) {

            if (comment.parentId !== null) {
                conn.query(`SELECT postId FROM comments WHERE id=${comment.parentId}`,
                    function(err, results) {

                        var parentPostId = Number(results[0].postId);

                        if (Number(comment.postId) !== parentPostId) {
                            console.log("Oops, you entered parentId " + comment.parentId + " and postId " + comment.postId + ". " +
                                "\n" + "but parentId " + comment.parentId + " actually has postId " + parentPostId +
                                "\n" + "Please change parentId or postId.")
                        }
                        else {
                            createComm();
                        }
                    })
            }
            else {
                createComm();
            }

            function createComm() {

                conn.query(`
              INSERT INTO comments (text, userId, postId, parentId, createdAt)
                VALUES (?, ?, ?, ?, ?)
            `, [comment.text, comment.userId, comment.postId, comment.parentId, null],
                    function(err, result) {
                        if (err) {
                            callback(err);
                        }
                        else {
                            /*
                            Comment inserted successfully. Let's use the result.insertId to retrieve
                            the comment and send it to the caller!
                            */
                            conn.query(
                                'SELECT `id`, `text`, `userId`,`postId`, `parentId` , `createdAt` FROM `comments` WHERE `id` = ?', [result.insertId],
                                function(err, result) {
                                    if (err) {
                                        callback(err);
                                    }
                                    else {
                                        callback(null, result[0]);
                                    }
                                }
                            );
                        }
                    }
                );
            }
        },
        getCommentsForPost: function(postId, callback) {

            var sqlQuery = `
          SELECT id, text, parentId
          FROM comments
          WHERE comments.postId=${postId}  
          `
            conn.query(sqlQuery,
                function(err, results) {
                    if (err) {
                        callback(err);
                    }
                    else if (results.length === 0) {
                        console.log("Post ID does not exist");
                        return;
                    }
                    else {

                        // get rid of rowDataPacket
                        var categoriesPre = JSON.stringify(results);
                        var categories = JSON.parse(categoriesPre);

                        console.log(categories);

                        function makeTree(categories, parentId) {
                            var node = {}
                            categories
                                .filter(function(c) {
                                    // console.log(c)
                                    return c.parentId === parentId

                                })

                            .forEach(function(c, index) {
                                // console.log(c, index);
                                // console.log(node);
                                // node['id'] = c.id;
                                // node['text'] = c.text;
                                // node[c.text] = c.text;
                                node[c.id] = makeTree(categories, c.id)
                                return;
                            })
                            return node;
                        }

                        callback(JSON.stringify(makeTree(categories, null), null, 2));
                        // callback(makeTree(categories, null));


                    }
                }
            );
        },
        checkLogin: function(username, pwd, callback) {
            var dbQuery = `
                SELECT * 
                FROM users 
                WHERE username = '${username}'
                `
            console.log("EXECUTING CHECKLOGIN----------------------------------")

            conn.query(dbQuery, function(err, results) {

                console.log("IN EXECUTING CHECKLOGIN----------------------------------")
                console.log("QUERY RESULTS----------------------------------", results)
                console.log("QUERY RESULTS LENGTH----------------------------------", results.length)
                    // console.log(err, results);

                if (results.length === 0) {
                    console.log("ERROR results.length is 0 ----------------------", err)
                        // error message query had no result
                        // callback(new Error('username of pw incorrect'));
                    callback(null, false);
                    // return;
                }
                else {
                    // now we have resulting user info, need to validate password
                    var user = results[0]; // all info for given userId
                    console.log("RETRIEVED INFO========================", user)
                    var actualUserPwd = results[0].password || ""; // actual pwd stored in the database

                    console.log("RETRIEVED PASSWORD========================", actualUserPwd)
                    console.log("FORM PASSWORD========================", pwd)


                    bcrypt.compare(pwd, actualUserPwd, function(err, result) {
                        if (err) {
                            console.log(err) // shouldnt be an error here, will return true or false
                            callback(null, false); //return as if passswords did not match

                        }

                        console.log("bcrypt result===============", result)

                        if (result === true) {
                            // password match true, return all user to router
                            callback(null, user)
                        }
                        else {
                            // password match NOT true, return false to router
                            callback(null, false);
                        }
                    })

                }
            })

        },
        createSessionToken: function(userId, callback) {
            // new function declaration
            return secureRandom.randomArray(100).map(code => code.toString(36)).join('')
                // return secureRandom.randomArray(100).map(function(code) {return code.toString(36)}).join('');

        },
        createSession: function(userId, callback) {
            var token = this.createSessionToken();
            var dbQuery = `
            INSERT INTO sessions
            SET 
            userId = ${userId},
            token = '${token}'
            `
            conn.query(dbQuery, function(err, result) {
                console.log("QUERY REUSLT---------------", result)
                console.log("QUERY ERR---------------", err)

                if (err) {
                    // session could already exist, user just deleted his cookies, so get the session
                    console.log("==============ERR EXISTS===========")
                    var dbQuery2 = `
                    SELECT token
                    FROM sessions
                    WHERE
                    userId = ${userId}
                    `
                    conn.query(dbQuery2, function(err, result) {
                        console.log("create session ERR===========================", err)
                        console.log("create session RESULT================", result)

                        if (err) {
                            //if for some reason query returns nothing, return error
                            callback(err)
                        }
                        else {
                            console.log("results of query to get session================================", result)
                                // send existing token back to routing to make a cookie with it
                            callback(null, result[0].token)
                        }

                    })

                }
                else {
                    // if success, return the token so that we can use for cookies
                    callback(null, token);
                }
            })
        },
        getUserInfoFromSession: function(session, callback) {
            // does a match exist for token in users cookies
            // if yes, return all info for that user

            var dbQuery = `
                SELECT sessions.userId AS sessions_userId, sessions.token AS sessions_token, 
                users.id AS users_id, users.username AS users_username
                FROM sessions
                JOIN users
                ON sessions.userId=users.id
                WHERE sessions.token = '${session}'
            `
            conn.query(dbQuery, function(err, result) {
                // console.log("QUERY ERR=============================", err)
                // console.log("QUERY RESULT=============================", result)

                if (err) {
                    // session not linked to a userId, unlikely to occur
                    callback(null, false);
                }
                else if (result.length === 0) {
                    // result is an array with no length if no record exists
                    callback(null, false);
                }
                else {
                    callback(null, result[0]);
                }
            })

        },

        // displayAllPosts: function() {
        //     // Goal is to return html when called

        //     // return "result of displayAllPosts API function";
        //     return this.getAllPosts(function(err, posts) {
        //         // OPTIONS PER PAGE ARE DEFINED IN THIS Fn
        //         // console.log("POSTS RESULT============================", posts)
        //         // console.log("POSTS ERR============================", err)

        //         // return "<h1>2222</h1>";
        //         var htmlString = ""
        //             // start with an empty string

        //         // concatenate li strings, adding info about each post
        //         posts.forEach(function(obj) {
        //             htmlString = htmlString + `
    
        //         <li class="content-item">
        //           <h2 class="content-item__title">
        //               <a href="${obj.url}">${obj.title}</a>
        //           </h2>
        //               <p>Created ${moment(obj.createdAt).fromNow()}</p>
        //         </li>`
        //         })

        //         // concatenate string by adding header and footer info
        //         var htmlStr = `
        //      <div id="contents">
        //         <h1>List of All Posts</h1>
        //         <ul class="contents-list">` + htmlString +
        //             `</ul></div>
        //     <form action="/" method="GET"> 
      
        //         <button type="submit">Back to Homepage</button>
        //     </form>
        //     `;
        //         console.log("HTML STRING========================", htmlString)
        //         return htmlStr;

        //     })
        // },
        renderLayout: function(mainTitle, mainContent, userId, username) {
        // this function wraps the inputted html in standard html
        // last 2 arguments may not be passed if user is not logged in
        // first need to define header to display depends on if user is logged in
        
            
            var header = `
            <ul>
                <li><button><a href="/signup" style="text-decoration:none">Sign Up</a></button></li>
                <li><button><a href="/login" style="text-decoration:none">Login</a></button></li>
            </ul>
        
        `
            
            var headerLoggedIn = `
            <ul>
                <li>Hi ${username}!</li>
                <li><button><a href="/posts/${userId}" style="text-decoration:none">my posts</a></button></li>
                <li><button><a href="/createContent" style="text-decoration:none">create post</a></button></li>
                <li><button><a href="/logout" style="text-decoration:none">logout</a></button></li>
            </ul>
        `

            var masterHtml = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>reddit clone</title>
                    <link rel="stylesheet" href="../style.css" type="text/css" />
                </head>
                <body>
                    <header class="subreddit-options-header">
                    <nav><ul>
                        <li>subredd1</li>
                        <li>subredd2</li>
                        <li>subredd3</li>
                        <li>subredd4</li>
                    </ul></nav>
                    </header>
                    <header class="logo-header">
                        <ul class="logo-header-items">
                            <a href="/">
                            <li id="logo"><img src="../logo.png" alt="" height=50 width=50></li>
                            </a>
                            <li id="title"><h1 class="main-logo">REDDIT CLONE</h1></li>
                            <li id="user-header">
                                ${userId ? headerLoggedIn : header}
                            </li>
                        </ul>
                    </header>
                    
                    <main>  
                        <h1 class="main-content-title">${mainTitle}</h1>
                        ${mainContent}
                    
                    </main> 
        
                    <footer>--FOOTER--Creddit &copy</footer>
                    <script src="https://code.jquery.com/jquery-1.12.3.js"></script>
                    <script>
                    
                    </script>
                </body>
            </html> 
            `

            return(masterHtml);

        },
        createOrUpdateVote: function(vote, callback) {
            var dbQuery = `
            INSERT INTO votes SET 
            postId = ${vote.postId}, 
            userId = ${vote.userId}, 
            createdAt = null, 
            vote = ${vote.vote} 
            ON DUPLICATE 
            KEY UPDATE vote = ${vote.vote} 
            `
            conn.query(dbQuery, function(err, result) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        /*
                        vote inserted successfully.
                        */
                        callback(null, result)
                    }
                }
            );
        },
        // insert new functions here




    }
}