/*
 * Main Controller
 */

var log4js = require('log4js'), 
    log4jsMongo = require('log4js-mongodb');

log4js.addAppender(log4jsMongo.appender());

log4js.getLogger().info('Ready to log!');



var messaging = require("../util/message/core");
exports.index = function(req, res) {
	var msg = {};
	if(req.query.msg != undefined && req.query.msg != "") {
		var translated_message = messaging.getMessage(req.query.msg);
		if(translated_message) msg = translated_message;
	}
  res.render('index', { title: __('SourceDoc | Document your code, continuously.'), msg: msg, page_name: "index" });
};