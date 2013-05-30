/*
 * Authentication middleware.
 * For checking user authentication and set application global variables.
 */
exports.authCheck = function(req, res, next) {
  //a list of restricted places
  var restricted_places = ["/panel", "/github_sync", "/active_sourcedoc"];
  //not authenticated
  res.locals.isAuthenticated = false;
  if (req.session.user != null) {
    var repoCats = [];

    //add current username and id first
    repoCats.push({ name: req.session.user.login, id: req.session.user.id });
    //get user's organizations
    var mongoose = require('mongoose'),
        UserOrganization = mongoose.model('UserOrganization');

    var userOrgs = UserOrganization.find({ username: req.session.user.login }).exec(function (errRepo, repos) {
      for (var i = repos.length - 1; i >= 0; i--) {
        var currentItem = repos[i];
        //add orgs
        repoCats.push({ name: currentItem.orgName, id: currentItem.orgId });
      };

      //pass it to global scope
      res.locals.repoCategories = repoCats;
      next();
    });

    //Ok, fine. You're authenticated...
    res.locals.githubUser = req.session.user;
    res.locals.isAuthenticated = true;
  } else {
    //not authenticated
    if(restricted_places.indexOf(req._parsedUrl.pathname) >= 0) {
      //redirect user and show not-authenticated message
      res.writeHead(303, {
        Location: "/?msg=auth_required"
      });
      res.end();
      return;
    }
    next();
  }
};