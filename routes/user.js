/*
 * GET users listing.
 */

var messaging = require("../util/message/core"),
		githubClient = require("github");

var github = new githubClient({
    version: "3.0.0"
});

exports.panel = function(req, res) {
	var msg = {};
	if(req.query.msg != undefined && req.query.msg != "") {
		var translated_message = messaging._(req.query.msg);
		if(translated_message) msg = translated_message;
	}

	if(req.cookies["githubAccessToken"] && req.cookies["githubAccessToken"] != "") {
    //authenticate github API
    github.authenticate({
        type: "oauth",
        token: req.cookies["githubAccessToken"]
    });

		github.user.get({}, function(err, user) {
      if (err) {
    		//todo: we should do this kind of error managements in a centralized unit
    		var redirectMsg = "unhandled_exception"
        if(err.code == 401) {
		      res.writeHead(303, {
		          Location: "/?msg=auth_required"
		      });
		      res.end();
	        return;
        }
				//redirect back
	      res.writeHead(303, {
	          Location: "/panel?msg=" + redirectMsg
	      });
	      res.end();
        return;
      }

			github.repos.getFromUser({
	      user: user.login
		  }, function(err, repoObj) {
	      console.log(repoObj);
  			res.render('panel', { title: 'User Panel', msg: msg });
		  });

    });
	} else {
    res.writeHead(303, {
        Location: "/?msg=auth_required"
    });
    res.end();
	}
};