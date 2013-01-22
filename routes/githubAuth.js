/**
 * Github authentication
 */

var http = require("http");
var Url = require("url");
var querystring = require("querystring");

var githubClient = require("github");
var OAuth2 = require("oauth").OAuth2;

var github = new githubClient({
    version: "3.0.0"
});

//SourceDoc API key
var clientId = "54b194272f2962b19ca9";
var secret = "52e760ce56d82fbcee8f79eac0d326710ad1309c";
var oauth = new OAuth2(clientId, secret, "https://github.com/", "login/oauth/authorize", "login/oauth/access_token");

var accessToken = "";

//Start Github authentication
exports.auth = function(req, res) {
  res.writeHead(303, {
      Location: oauth.getAuthorizeUrl({
          scope: "repo,gist"
      })
  });
  res.end();
};

//Github authentication callback
exports.authCallback = function(req, res) {
	if(req.query.code && req.query.code != "") {
	  //upgrade the code to an access token
	  oauth.getOAuthAccessToken(req.query.code, {}, function (err, access_token, refresh_token) {
	      if (err) {
	          res.writeHead(500);
	          res.end(err + "");
	          return;
	      }
	      accessToken = access_token;
	      //set cookie to client
	      res.cookie('githubAccessToken', accessToken, { maxAge: 900000, httpOnly: true });
	      //redirect back
	      res.writeHead(303, {
	          Location: "/panel?msg=auth_success"
	      });
	      res.end();
	  });
	} else {
    res.writeHead(500);
    res.end("Error: Authentication code is required.");
	}
};