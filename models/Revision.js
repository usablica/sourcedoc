//Revision schema
//Used for collecting repositories update/push information
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var RevisionSchema = new Schema({
    commit: {
      committer: {
        email: String,
        username: String,
        name: String
      },
      id: String,
      message: String,
      timestamp: Date,
      url: String
    },
    repository: {
      github_id: Number,
      name: String
    },
    revision: { type: Number, unique: true }, 
    success: { type: Boolean, default: false },
    in_progress: { type: Boolean, default: true },
    status: { type: String },
    created_at: { type: Date, default: Date.now }
});

mongoose.model('Revision', RevisionSchema);