const fs = require('fs');

module.exports = function loadCoverage(source, options = {}) {
  const warn = options.warn || console.warn;

  const readJSON = options.readJSON
    || function (filePath) {
      if (!fs.existsSync(filePath)) {
        warn(new Error(`Cannot find file: "${filePath}"`));
        return {};
      }
      return JSON.parse(fs.readFileSync(filePath));
    };

  return readJSON(source);
};
