//Repository schema
//Used for collecting repositories information
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var RepositorySchema = new Schema({
    github_id: { type: Number, unique: true, index: true },
    owner: {
      id: Number,
      username: String
    },
    name: { type: String },
    clone_url: { type: String },
    html_url: { type: String },
    git_url: { type: String },
    homepage: { type: String },
    ssh_url: { type: String },
    language: { type: String },
    size: { type: Number },
    is_fork: { type: Boolean },
    sourcedoc_enable: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
});

mongoose.model('Repository', RepositorySchema);