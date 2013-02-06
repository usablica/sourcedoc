/*
 * Authentication middleware.
 * For checking user authentication and set application global variables.
 */
exports.authCheck = function(req, res, next) {
  //not authenticated
  res.locals.isAuthenticated = false;
  if (req.session.user != null) {
    //Ok, fine. You're authenticated...
    res.locals.githubUser = req.session.user;
    res.locals.isAuthenticated = true;
  }
  next();
};