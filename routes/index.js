/*
 * GET home page.
 */

var messaging = require("../util/message/core");
exports.index = function(req, res) {
	var msg = {};
	if(req.query.msg != undefined && req.query.msg != "") {
		var translated_message = messaging._(req.query.msg);
		if(translated_message) msg = translated_message;
	}
  res.render('index', { title: 'SourceDoc | Document your code, continuously.', msg: msg });
};