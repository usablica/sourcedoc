/*
 * GET users listing.
 */
var messaging = require("../util/message/core"),
  githubClient = require("github");

var github = new githubClient({
  version: "3.0.0"
});

exports.panel = function (req, res) {
  var msg = {};
  if (req.query.msg != undefined && req.query.msg != "") {
    var translated_message = messaging.getMessage(req.query.msg);
    if (translated_message) msg = translated_message;
  }
  if (res.locals.isAuthenticated) {
    github.repos.getFromUser({
      user: res.locals.githubUsername
    }, function (err, repoObj) {
      console.log(repoObj);
      res.render('panel', {
        title: __('User Panel'),
        msg: msg,
        page_name: "panel",
        repos: repoObj
      });
    });
  } else {
    res.writeHead(303, {
      Location: "/?msg=auth_required"
    });
    res.end();
  }
};

exports.logout = function (req, res) {
  //remove the github token from user's browser
  res.clearCookie('githubAccessToken');
  res.redirect('/');
};