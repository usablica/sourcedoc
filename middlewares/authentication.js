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
    //Ok, fine. You're authenticated...
    res.locals.githubUser = req.session.user;
    res.locals.isAuthenticated = true;
  }
  if(restricted_places.indexOf(req._parsedUrl.pathname) >= 0) {
    //Ok we should now check user authentication
    if(!res.locals.isAuthenticated) {
      //redirect user and show not-authenticated message
      res.writeHead(303, {
        Location: "/?msg=auth_required"
      });
      res.end();
      return;
    }
  }
  next();
};