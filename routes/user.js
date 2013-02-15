/*
 * GET users listing.
 */
var messaging = require("../util/message/core"),
  github_client = require("github"),
  mongoose = require('mongoose'),
  Repository = mongoose.model('Repository'),
  User = mongoose.model('User'),
  github = new github_client({
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
  
  Repository.find({ "owner.id": req.session.user.id })
            .sort('is_fork')
            .exec(function(errRepo, repos) {
              User.find({ "github_id": req.session.user.id }).exec(function(errUser, user) {
                if(errRepo || errUser || user.length < 1) {
                  res.writeHead(500);
                  res.end(__("Unexpected error while loading your information. Please re-try again."));
                  return;
                }
                res.render('panel', {
                  title: __('User Panel'),
                  msg: msg,
                  page_name: "panel",
                  repos: repos,
                  last_github_sync: user[0].last_github_sync,
                  language_colors: require("../util/language_colors.js").language_colors
                });
              });
            });
};
/**
 * Logout from account
 */
exports.logout = function (req, res) {
  //remove the github token from user's browser
  req.session = null
  res.redirect('/');
};
/**
 * Sync repositories database with Github
 */
exports.githubSync = function (req, res) {
  github.authenticate({
    type: "oauth",
    token: res.locals.githubUser.accessToken
  });
  github.repos.getFromUser({
    user: res.locals.githubUser.login
  }, function (err, repoObj) {
    for (var i = 0, arrLen = repoObj.length; i < arrLen; i++) {
      var objItem = repoObj[i];
      new Repository({
        github_id: objItem.id,
        owner: {
          id: objItem.owner.id,
          username: objItem.owner.login
        },
        name: objItem.name,
        html_url: objItem.html_url,
        clone_url: objItem.clone_url,
        git_url: objItem.git_url,
        homepage: objItem.homepage,
        ssh_url: objItem.ssh_url,
        language: objItem.language,
        size: objItem.size,
        is_fork: objItem.fork,
        created_at: objItem.created_at
      }).save();
    }
    //update user's last github sync time
    //todo: we don't need this callback function but mongoose doesn't update the docuemnt when we don't bind the callback function
    //this is my question on stackoverflow: http://stackoverflow.com/q/14877967/375966
    User.findOneAndUpdate({ github_id: res.locals.githubUser.id }, { last_github_sync: new Date() }).exec();

    res.redirect('/panel?msg=successfully_synced');
  });
};