/*
 * Users Controller
 */
var messaging = require("../util/message/core"),
  github_client = require("github"),
  mongoose = require('mongoose'),
  Repository = mongoose.model('Repository'),
  UserOrganization = mongoose.model('UserOrganization'),
  Revision = mongoose.model('Revision'),
  User = mongoose.model('User'),
  github = new github_client({
    version: "3.0.0"
  });

/**
 * Check that the current user has access to given login name or not
 */
function hasAccess(currentUser, loginName, cb) {
  var returnValue = false;
  if (currentUser.login == loginName) {
    returnValue = true;
  }
  //check if the given user is an organization
  UserOrganization.findOne({ username: currentUser.login, orgName: loginName }).exec(function (errUser, user) {
    if (user != null) {
      returnValue = true;  
    }
    cb(returnValue);
  });
}

/**
 * Users main panel
 */
exports.panel = function (req, res) {
  var loginName = req.params.login || req.session.user.login;

  //check user athority
  hasAccess(req.session.user, loginName, function(isAuthorized) {
    
    if (!isAuthorized) {
      //redirect user and show not-authenticated message
      res.writeHead(303, {
        Location: "/?msg=auth_required"
      });
      res.end();
      return;
    }

    var msg = {};
    if (req.query.msg != undefined && req.query.msg != "") {
      var translated_message = messaging.getMessage(req.query.msg);
      if (translated_message) msg = translated_message;
    }

    User.findOne({ "username": loginName }).exec(function (errUser, user) {
      Repository.find({
        "owner.id": user.github_id,
      })
        .sort('is_fork')
        .exec(function (errRepo, repos) {
          if (errRepo || errUser) {
            res.writeHead(500);
            res.end(__("Unexpected error while loading your information. Please re-try again."));
            return;
          }

          if(repos.length < 1) {
            res.render('panel', {
              title: __('User Panel'),
              msg: msg,
              page_name: "panel",
              moment: require("moment"),
              repos: [],
              last_github_sync: user.last_github_sync,
            });
            return;
          }

          //To collect repositories revision
          var repoRevisions = {};

          for (var i = 0, reposLen = repos.length; i < reposLen; i++) {
            //Add/Join Revision data to the Repository model
            (function (currentRepo) {
              Revision.findOne({
                "repository.github_id": currentRepo.github_id
              }).sort('-created_at')
                .exec(function (errLastRevision, lastRevisionDoc) {
                if (errLastRevision) {
                  res.writeHead(500);
                  res.end(__("Unexpected error while loading your information. Please re-try again."));
                  return;
                }
                if (lastRevisionDoc) {
                  repoRevisions[currentRepo.github_id] = ({
                    revision: lastRevisionDoc.revision,
                    success: lastRevisionDoc.success,
                    in_progress: lastRevisionDoc.in_progress
                  });
                } else {
                  repoRevisions[currentRepo.github_id] = {
                    revision: 0,
                    success: false,
                    in_progress: false
                  };
                }
                //Sorry guys for this condition, I wrote that to know WHEN the Mongoose callback completed to render the page
                if (Object.keys(repoRevisions).length == repos.length) {
                  res.render('panel', {
                    title: __('User Panel'),
                    msg: msg,
                    page_name: "panel",
                    moment: require("moment"),
                    repoRevisions: repoRevisions,
                    repos: repos,
                    last_github_sync: user.last_github_sync,
                    language_colors: require("../util/language_colors.js").language_colors
                  });
                }
              });
            })(repos[i]);
          }
      });
    });
  });
};

/**
 * Logout from account
 */
exports.logout = function (req, res) {
  //remove the github token from user's browser
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

      //add user's organizations
      new User({
          //set organization flag to true
          isOrganization: true,
          username: currentItem.login,
          url: currentItem.url,
          name: currentItem.login,
          github_id: currentItem.id,
          avatar_url: currentItem.avatar_url,
          location: "",
          email: "",
          blog: "",
          public_repos: "",
          public_gists: "",
          last_github_sync: null
        }).save();

      //add user organization relationship
      new UserOrganization({
        userId: res.locals.githubUser.id,
        username: res.locals.githubUser.login,
        orgId: currentItem.id,
        orgName: currentItem.login
      }).save();

      //get organization's repos
      github.repos.getFromOrg({
        org: currentItem.login
      }, function (err_getRepos, got_repos) {
        for (var i = got_repos.length - 1; i >= 0; i--) {
          var objItem = got_repos[i];

          //insert
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
        };
      });
    
  //get user's repos
  github.repos.getAll({}, function (err, repoObj) {

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
    User.findOneAndUpdate({
      github_id: res.locals.githubUser.id
    }, {
      last_github_sync: new Date()
    }).exec();

    res.redirect('/panel?msg=successfully_synced');
  });
};