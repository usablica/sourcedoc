/*
 * GET users listing.
 */
var messaging = require("../util/message/core"),
  github_client = require("github"),
  mongoose = require('mongoose'),
  Repository = mongoose.model('Repository'),
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
            .exec(function(err, repos) {
              console.log(req.session.user.id);
              console.log(repos);
              res.render('panel', {
                title: __('User Panel'),
                msg: msg,
                page_name: "panel",
                repos: repos,
                language_colors: require("../util/language_colors.js").language_colors
              });
            });
};
/**
 * Logout from account
 */
exports.logout = function (req, res) {
  //remove the github token from user's browser
  req.session = null
  req.session.destroy();
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
    console.log(repoObj);
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

    res.redirect('/panel?msg=successfully_synced');
  });
};