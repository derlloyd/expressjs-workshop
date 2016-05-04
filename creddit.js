var bcrypt = require('bcrypt');
var HASH_ROUNDS = 10;  

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
        'INSERT INTO `posts` (`userId`, `title`, `url`, `createdAt`, `subredditId`) VALUES (?, ?, ?, ?, ?)', 
        [post.userId, post.title, post.url, null, post.subredditId],
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
    getAllPosts: function(options, callback) {
      // In case we are called without an options parameter, shift all the parameters manually
      if (!callback) {
        callback = options;
        options = {};
      }
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;
      
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
        users.createdAt AS users_createdAt, users.updatedAt AS users_updatedAt
        FROM posts
        JOIN users
        ON posts.userId=users.id
        JOIN subreddits
        ON posts.subredditId=subreddits.id
        ORDER BY posts.createdAt DESC
        LIMIT ? OFFSET ?
        `, [limit, offset],
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            callback(results.map(function(obj) {
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
          if (err) {
            callback(err);
          } 
          else if (results.length === 0) {
            console.log("User ID does not exist");
            callback(err);
            return;
          }
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
    checkLogin: function(userId, pwd, callback) {
    var dbQuery = `
    SELECT * 
    FROM users 
    WHERE id = ${userId}
    `
    console.log("EXECUTING CHECKLOGIN----------------------------------")
  
    conn.query(dbQuery, function(err, results) {
  
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
  
  
      // cancel this code for now
      if (actualUserPwd === pwd) {
        callback(null, user);
      return;  
      }
      else {
        callback(err);
        return;
      }
      
      
      
      bcrypt.compare(pwd, actualUserPwd, function(err, result) {
        if (err) {
          console.log(err)  // shouldnt be an error here, will return true or false
        }
        
        console.log("bcrypt result===============", result)
        if (result === true) {
          // password match true, return all user info
          callback(null, user)
        }
        else {
          callback(err);
        }
      })
  
  
  
    }
  })
  
}
  
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
  }
}

          