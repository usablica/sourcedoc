/**
 * Module dependencies.
 */
var express = require('express'),
    http = require('http'),
    path = require('path'),
    github_client = require("github"),
    i18n = require("i18n"),
    fs = require('fs'),
    mongoose = require('mongoose');

var github = new github_client({
    version: "3.0.0"
});

//localization config 
i18n.configure({
    locales:['en'],
    register: global
});

//Load all models
var models_path = __dirname + '/models';
fs.readdirSync(models_path).forEach(function (file) {
  require(models_path + '/' + file);
});

//Loading routes
var routes = require('./routes'),
    user = require('./routes/user'),
    github = require('./routes/github'),
    app = express();

//Global variables
app.locals({
  __: i18n.__,
  __n: i18n.__n
});
//set an global variable to hold all SourceDoc configs and use it in all parts of application
GLOBAL.systemConfig = require(__dirname + '/config.js').systemConfigs;

//DB connection
mongoose.connect(systemConfig.mongoDbConnection);

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'sourcedoc', expires: false }));
  app.use(i18n.init);
  app.use(express.static(path.join(__dirname, 'public')));
  //User authentication and more
  app.use(require('./middlewares/authentication.js').authCheck);
  app.use(app.router);
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

//Homepage
app.get('/', routes.index);
//Start Github authentication
app.get('/github_auth', github.auth);
//Github authentication callback
app.get('/github_auth_callback', github.authCallback);
//Sync repositories with Github
app.get('/github_sync', user.githubSync);
//Users panel
app.get('/panel', user.panel);
//Logout from account
app.get('/logout', user.logout);
//Active/de-active SourceDoc for repository
app.post('/active_sourcedoc', user.activeSourceDoc);
//Receive and process Github Post-Receive hooks
app.post('/github_hook', github.githubHook);

http.createServer(app).listen(app.get('port'), function() {
  console.log("SourceDoc server listening on port " + app.get('port'));
});