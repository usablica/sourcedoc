
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , githubAuth = require('./routes/githubAuth')
  , http = require('http')
  , path = require('path')
  , githubClient = require("github")
  , i18n = require("i18n");

var github = new githubClient({
    version: "3.0.0"
});

//localization config 
i18n.configure({
    locales:['en'],
    register: global
});

var app = express();

//Global variables
app.locals({
  __: i18n.__,
  __n: i18n.__n
});

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(i18n.init);
  app.use(express.static(path.join(__dirname, 'public')));
  //User authentication and more
  app.use(function(req, res, next) {
    //not authenticated
    res.locals.isAuthenticated = false;
    if(req.cookies != undefined && req.cookies["githubAccessToken"] && req.cookies["githubAccessToken"] != "") {
      //authenticate github API
      github.authenticate({
          type: "oauth",
          token: req.cookies["githubAccessToken"]
      });

      github.user.get({}, function(err, user) {
        //OK, fine, you're authenticated
        if(user && user.login) {
          console.log(user);
          res.locals.isAuthenticated = true;
          res.locals.githubUsername = user.login;
          res.locals.githubUser = user;
        }
        next();
		  });
    } else {
      next();
    }
  });
  app.use(app.router);
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

//Homepage
app.get('/', routes.index);
//Start Github authentication
app.get('/githubAuth', githubAuth.auth);
//Github authentication callback
app.get('/githubAuthCallback', githubAuth.authCallback);
//users panel
app.get('/panel', user.panel);
//logout from account
app.get('/logout', user.logout);

http.createServer(app).listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});