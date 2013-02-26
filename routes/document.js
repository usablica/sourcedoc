/*
 * Document routes
 */
var mongoose = require('mongoose'),
    Revision = mongoose.model('Revision'),
    Repository = mongoose.model('Repository'),
    fs = require('fs');

exports.getDocument = function(req, res, app) {

  var repoName = req.params.repo,
      username = req.params.username;
  Repository.findOne({ "owner.username": username, "name": repoName, sourcedoc_enable: true }, "github_id owner.username name", function(err, repo) {
    if(!err) {
      if(repo) {
          //get the last revision of document
          Revision.findOne({
            "repository.github_id": repo.github_id
          }).sort('-created_at')
            .exec(function (errLastRevision, lastRevisionDoc) {
              var documentPath = systemConfig.docsOutput.
                                             replace("{0}", repo.owner.username).
                                             replace("{1}", repo.name).
                                             replace("{2}", lastRevisionDoc.revision);

              fs.readFile(documentPath + "/" + "index.html", function (err, data) {
                if (err) throw err;
                res.contentType("text/html")
                res.writeHead(200);
                res.write(data, 'utf8');
                res.end();
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