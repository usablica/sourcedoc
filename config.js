/**
 * SourceDoc basic configuration
 */
exports.systemConfigs = {
  "reposPath": "repos/",
  "sourceDocInitFile": ".sourcedoc.yml",
  "mongoDbConnection": "mongodb://localhost/sourcedoc",
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