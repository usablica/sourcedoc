/*
 * GET users listing.
 */
var messaging = require("../util/message/core"),
  githubClient = require("github");

var github = new githubClient({
  version: "3.0.0"
});
/**
* Users main panel
*/
exports.panel = function (req, res) {
  var msg = {};
  if (req.query.msg != undefined && req.query.msg != "") {
    var translated_message = messaging.getMessage(req.query.msg);
    if (translated_message) msg = translated_message;
  }
  if (res.locals.isAuthenticated) {
      res.render('panel', {
        title: __('User Panel'),
        msg: msg,
        page_name: "panel",
        repos: []
      });
  } else {
    res.writeHead(303, {
      Location: "/?msg=auth_required"
    });
    res.end();
  }
};
/**
* Logout from account
*/
exports.logout = function (req, res) {
  //remove the github token from user's browser
  res.clearCookie('githubAccessToken');
  res.redirect('/');
};
/**
* Sync repositories database with Github
*/
exports.githubSync = function (req, res) {
  github.authenticate({
    type: "oauth",
    token: res.locals.githubUser.access_token
  });
  github.repos.getFromUser({
    user: res.locals.githubUser.login
  }, function (err, repoObj) {
    console.log(repoObj);
    
    res.redirect('/panel?msg=successfully_synced');
  });
};