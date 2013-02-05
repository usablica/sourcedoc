/*
 * Authentication middleware.
 * For checking user authentication and set application global variables.
 */
var githubClient = require("github"),
    github = new githubClient({
      version: "3.0.0"
    });

exports.authCheck = function(req, res, next) {
  //not authenticated
  res.locals.isAuthenticated = false;
  if(req.cookies != undefined && req.cookies["githubAccessToken"] && req.cookies["githubAccessToken"] != "") {
    //authenticate github API
    github.authenticate({
        type: "oauth",
        token: req.cookies["githubAccessToken"]
    });

    github.user.get({}, function(err, user) {
      //OK, fine, you're authenticated
      if(user && user.login) {
        res.locals.isAuthenticated = true;
        res.locals.githubUsername = user.login;
        console.log(user);
        res.locals.githubUser = user;
      }
      next();
	  });
  } else {
    next();
  }
};