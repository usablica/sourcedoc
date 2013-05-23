/**
 * Github Controller
 */
var http = require("http"),
  Url = require("url"),
  querystring = require("querystring"),
  github_client = require("github"),
  OAuth2 = require("oauth").OAuth2,
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Repository = mongoose.model('Repository'),
  Revision = mongoose.model('Revision'),
  spawn = require('child_process').spawn,
  fs = require('fs'),
  yaml = require('js-yaml'),
  github = new github_client({
    version: "3.0.0"
  }),
  mkdirp = require('mkdirp');

//SourceDoc API key
var clientId = "54b194272f2962b19ca9";
var secret = "52e760ce56d82fbcee8f79eac0d326710ad1309c";
var oauth = new OAuth2(clientId, secret, "https://github.com/", "login/oauth/authorize", "login/oauth/access_token");

//Start Github authentication
exports.auth = function (req, res) {
  res.writeHead(303, {
    Location: oauth.getAuthorizeUrl({
      //Access to repositories and gists
      scope: "repo"
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
          public_gists: user.public_gists,
          last_github_sync: null
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

//Github post-receive hooks
exports.githubHook = function (req, res) {
  if (req.body != null && req.body.payload != null) {
    var repositoryObj = JSON.parse(req.body.payload);
    if (repositoryObj.repository != null && repositoryObj.repository.id != null) {
      //find repository from database
      Repository.findOne({
        "github_id": repositoryObj.repository.id,
        "sourcedoc_enable": true
      }).exec(function (err, repoObj) {
        if (err) {
          //todo: we should log this kind of errors
          return;
        }
        if (repoObj) {
          //get last revision document to determine next revision number
          Revision.findOne({
            "repository.github_id": repositoryObj.repository.id
          })
            .sort('-created_at')
            .exec(function (errLastRevision, lastRevisionDoc) {
            //repositories path
            var reposPath = systemConfig.reposPath + repoObj.owner.username + "/" + repoObj.name;
            //determine next revision number
            var nextRevisionNumber = 1;
            if(lastRevisionDoc && lastRevisionDoc.revision) {
              nextRevisionNumber = lastRevisionDoc.revision + 1;
            }
            //Used for storing document generator command output
            var commandOutput = "";
            var revisionObj = {
              commit: {
                committer: {
                  email: repositoryObj.head_commit.committer.email,
                  username: repositoryObj.head_commit.committer.username,
                  name: repositoryObj.head_commit.committer.name
                },
                id: repositoryObj.head_commit.id,
                message: repositoryObj.head_commit.message,
                timestamp: repositoryObj.head_commit.timestamp,
                url: repositoryObj.head_commit.url
              },
              repository: {
                github_id: repositoryObj.repository.id,
                name: repositoryObj.repository.name
              },
              revision: nextRevisionNumber,
              status: __("Generating document...")
            };

            //save a log into database
            var revisionDoc = new Revision(revisionObj).save(function (err, revisionDoc) {
              //First, remove old repository folder to prevent `git clone ...` error
              spawn("rm", ["-rf", reposPath]).on('exit', function (rmRfCode) {
                if (rmRfCode === 0) {
                  //clone repository with git command
                  spawn("git", ["clone", repoObj.git_url, reposPath]).on('exit', function (gitCloneCode) {
                    if (gitCloneCode === 0) {
                      fs.readFile(reposPath + "/" + systemConfig.sourceDocInitFile, 'utf8', function (err, data) {
                        if (!err) {
                          //parse YAML file
                          yaml.loadAll(data, function (doc) {
                            if (doc.engine) {
                              if (typeof (systemConfig.engines[doc.engine]) == "object") {
                                var engineObj = systemConfig.engines[doc.engine];
                                //clone the args array
                                var commandArgs = engineObj.args.slice(0);
                                var repositoryPath = systemConfig.docsOutput.
                                                     replace("{0}", repoObj.owner.username).
                                                     replace("{1}", repoObj.name).
                                                     replace("{2}", nextRevisionNumber);
                                //append output directory to the command.
                                //I know replacing {0} and {1} looks a little bit silly
                                commandArgs.push(repositoryPath);
                                //Make document directory
                                mkdirp.sync(repositoryPath);
                                var generateDocCommand = spawn('engineObj.command', commandArgs);
                                //catch errors
                                generateDocCommand.stderr.on('data', function (data) {
                                  //append all errors to variable
                                  commandOutput += data;
                                });
                                generateDocCommand.on('exit', function (docGenerateCode) {
                                  if (docGenerateCode === 0) {
                                    //everything is good, document generated
                                    revisionDoc.status = __("Document generated successfully.");
                                    revisionDoc.in_progress = false;
                                    revisionDoc.success = true;
                                    revisionDoc.save();
                                  } else {
                                    revisionDoc.status = commandOutput;
                                    revisionDoc.in_progress = false;
                                    revisionDoc.save();
                                  }
                                });
                              }
                            } else {
                              revisionDoc.status = __("SourceDoc initial file is not valid.");
                              revisionDoc.in_progress = false;
                              revisionDoc.save();
                            }
                          });
                        } else {
                          revisionDoc.status = __("Error while reading SourceDoc initial file from the repository.");
                          revisionDoc.in_progress = false;
                          revisionDoc.save();
                        }
                      });
                    }
                  });
                }
              });
            });
          });
        }
      });
    }
  }
};