/*
 * Messaging functions
 */
exports.getMessage = function(str) {
    var messages = require("./messages.js").messages;
	return messages[str];
};