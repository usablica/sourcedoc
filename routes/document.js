/**
 * Document Controller
 */
var mongoose = require('mongoose'),
  Revision = mongoose.model('Revision'),
  Repository = mongoose.model('Repository'),
  path = require('path'),
  send = require('send');

exports.getDocument = function (req, res) {
  var repoName = req.params.repo,
      username = req.params.username,
      revision = req.params.revision;

  Repository.findOne({
    "owner.username": username,
    "name": repoName,
    sourcedoc_enable: true
  }, "github_id", function (err, repo) {

    if (!err) {
      if (repo) {
        //get the last revision of document
        Revision.findOne({
          "repository.github_id": repo.github_id
        }).sort('-created_at')
          .exec(function (errLastRevision, lastRevisionDoc) {
          if(errLastRevision) {
            res.writeHead(500);
            res.end(__("An internal problem occurred while loading repository revisions, please try again."));
            return;
          }
          if(!lastRevisionDoc) {
            res.writeHead(404);
            res.end(__("No revision found for this repository."));
            return;
          }
          //I used `send` module to map the docs folder with the given url and parameters.
          //I'm not sure can I do this job with Express itself or not, so I used `send` module for now.
          send(req, req._parsedUrl.pathname + (revision != null ? "" : lastRevisionDoc.revision))
            .root(path.join(__dirname, "../docs"))
            .on("error", function (err) {
              res.statusCode = err.status || 500;
              res.end(err.message);
            })
            .pipe(res);
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