/*
 * Messaging functions
 */
var messages = require("./messages.js").messages;
exports._ = function(str) {
	return messages[str];
};