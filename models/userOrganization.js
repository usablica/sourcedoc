//UserOrganization schema
//Used for collecting UserOrganizations information
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var UserOrganizationSchema = new Schema({
    userId: { type: Number },
    username: { type: String },
    orgId: { type: Number },
    orgName: { type: String },
    createdAt: { type: Date, default: Date.now }
});

UserOrganizationSchema.index({ "orgName": 1, "username" : 1 }, { unique: true });

mongoose.model('UserOrganization', UserOrganizationSchema);