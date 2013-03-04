/**
 * SourceDoc basic configuration
 */
exports.systemConfigs = {
  //repositories path
  "reposPath": "repos/",
  //initial SourceDoc file, for reading document generator config and more...
  "sourceDocInitFile": ".sourcedoc.yml",
  //MongoDB connection config
  "mongoDbConnection": "mongodb://localhost/sourcedoc",
  //valid hook ip(s), SourceDoc accept hook requests only from these ip(s)
  "validHookIp": [
    
  ],
  //{0} for username, {1} for project name and {2} for revision number (e.g. docs/afshinm/persianjs/2)
  "docsOutput": "docs/{0}/{1}/{2}",
  "engines": {
    "yuidoc": {
      "command": "yuidoc",
      //we always append output directory at the end of command (in the yuiDoc, after -o parameter) so we don't add the directory here
      "args": [".", "-o"]
    }
  }
};