//User schema
//Used for collecting users information
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var UserSchema = new Schema({
    username: { type: String, unique: true, index: true },
    url: { type: String },
    name: { type: String },
    github_id: { type: Number },
    avatar_url: { type: String },
    location: { type: String },
    email: { type: String },
    blog: { type: String },
    public_repos: { type: Number },
    public_gists: { type: Number },
    last_github_sync: { type: Date },
    created_at: { type: Date, default: Date.now }
});

mongoose.model('User', UserSchema);