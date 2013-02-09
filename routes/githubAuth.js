/**
 * Github authentication
 */
var http = require("http"),
  Url = require("url"),
  querystring = require("querystring"),
  github_client = require("github"),
  OAuth2 = require("oauth").OAuth2,
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  github = new github_client({
    version: "3.0.0"
  });

//SourceDoc API key
var clientId = "54b194272f2962b19ca9";
var secret = "52e760ce56d82fbcee8f79eac0d326710ad1309c";
var oauth = new OAuth2(clientId, secret, "https://github.com/", "login/oauth/authorize", "login/oauth/access_token");

//Start Github authentication
exports.auth = function (req, res) {
  res.writeHead(303, {
    Location: oauth.getAuthorizeUrl({
      //Access to repositories and gists
      scope: "repo,gist"
    })
  });
  res.end();
};

//Github authentication callback
exports.authCallback = function (req, res) {
  if (req.query.code && req.query.code != "") {
    //upgrade the code to an access token
    oauth.getOAuthAccessToken(req.query.code, {}, function (err, access_token, refresh_token) {
      if (err || access_token == null) {
        //redirect back
        res.writeHead(303, {
            Location: "/?msg=auth_unknown_error"
        });
        res.end();
        return;
      }
      //authenticate github API
      github.authenticate({
        type: "oauth",
        token: access_token
      });
      github.user.get({}, function (err, user) {
        if (err || access_token == null) {
          //redirect back
          res.writeHead(303, {
            Location: "/?msg=auth_unknown_error"
          });
          res.end();
          return;
        }
        //Save user to the DB
        var userObj = new User({
          username: user.login,
          url: user.html_url,
          name: user.name,
          github_id: user.id,
          avatar_url: user.avatar_url,
          location: user.location,
          email: user.email,
          blog: user.blog,
          public_repos: user.public_repos,
          public_gists: user.public_gists
        }).save();
        //set user object to session
        req.session.user = user;
        req.session.user.accessToken = access_token;
        //redirect back
        res.writeHead(303, {
            Location: "/panel?msg=auth_success"
        });
        res.end();
      });
    });
  } else {
    res.writeHead(500);
    res.end(__("Error: Authentication code is required."));
  }
};