/**
 * Repository Controller
 */
var messaging = require("../util/message/core"),
  github_client = require("github"),
  mongoose = require('mongoose'),
  Repository = mongoose.model('Repository'),
  Revision = mongoose.model('Revision'),
  User = mongoose.model('User'),
  github = new github_client({
    version: "3.0.0"
  });

/**
 * Active or de-active SourceDoc for a repository
 */
exports.activeSourceDoc = function (req, res) {
  if (req.body != null && req.body.github_id != null && req.body.active != null) {
    Repository.findOneAndUpdate({
      github_id: req.body.github_id,
      "owner.id": res.locals.githubUser.id
    }, {
      sourcedoc_enable: (req.body.active == "true")
    }).exec();

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true
    }));
  } else {
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      message: __("Can't find required parameters.")
    }));
  }
};

/**
 * Show all repository revisions
 */
exports.getAllRevisions = function (req, res) {
  var repoName = req.params.repo,
      username = req.params.username;

  Repository.findOne({
    "owner.username": username,
    "name": repoName,
    sourcedoc_enable: true
  }, "github_id html_url homepage language name owner.username is_fork", function (err, repo) {
    if (!err) {
      if (repo) {

        //Get all repository revisions
        Revision.find({
          "repository.github_id": repo.github_id
        }).sort('-created_at')
          .exec(function (errRevisions, revisions) {
          if (errRevisions) {
            res.writeHead(500);
            res.end(__("An internal problem occurred while fetching revisions, please try again."));
            return;
          }
          res.render('revisions', {
            title: __('Repository revisions'),
            page_name: "panel",
            revisions: revisions,
            moment: require("moment"),
            repository: repo,
            username: username,
            language_colors: require("../util/language_colors.js").language_colors
          });
        });

      } else {
        res.writeHead(404);
        res.end(__("No such repository."));
      }

    } else {
      res.writeHead(500);
      res.end(__("An internal problem occurred while loading document, please try again."));
    }
  });

};