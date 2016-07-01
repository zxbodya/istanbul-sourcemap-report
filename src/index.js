const fs = require('fs');
const remap = require('./remap');
const { Report, Store } = require('istanbul');
/**
 * The basic API for utilising remap-istanbul
 * @param  {Array} sources The sources that could be consumed and remapped.
 *                                For muliple sources to be combined together, provide
 *                                an array of strings.
 * @param  {Object} reports An object where each key is the report type required and the value
 *                          is report options
 * @param  {Object} remapOptions An object with options for remapping
 *               exclude?  - a string or Regular Expression that filters out
 *                           any coverage where the file path matches
 *               readFile? - a function that can read a file
 *                           syncronously
 *               readJSON? - a function that can read and parse a
 *                           JSON file syncronously
 *               sources?  - a Istanbul store where inline sources will be
 *                           added
 *               warn?     - a function that logs warnings
 */
module.exports = function (sources, reports, remapOptions = {}) {
  const sourceStore = Store.create('memory');
  const collector = remap(
    sources.map(filePath => JSON.parse(fs.readFileSync(filePath))),
    Object.assign(
      {}, remapOptions, {
        sources: sourceStore,
      }
    ));

  Object.keys(reports)
    .forEach(
      reportType => {
        const options = Object.assign(
          Object.keys(sourceStore.map).length ? { sourceStore } : {},
          reports[reportType]
        );
        const reporter = Report.create(reportType, options);
        reporter.writeReport(collector, true);
      }
    );
};

module.exports.remap = remap;

