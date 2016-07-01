const { CoverageTransformer } = require('./CoverageTransformer');

/**
 * Remaps coverage data based on the source maps it discovers in the
 * covered files and returns a coverage Collector that contains the remappped
 * data.
 * @param  {Array|Object} coverage The coverage (or array of coverages) that need to be
 *                                                 remapped
 * @param  {Object} options A configuration object:
 *                              exclude?  - a string or Regular Expression that filters out
 *                                          any coverage where the file path matches
 *                              readFile? - a function that can read a file
 *                                          syncronously
 *                              readJSON? - a function that can read and parse a
 *                                          JSON file syncronously
 *                              sources?  - a Istanbul store where inline sources will be
 *                                          added
 *                              warn?     - a function that logs warnings
 * @return {Object}         The remapped collector
 */

function remap(coverage, options = {}) {
  const smc = new CoverageTransformer(options);

  coverage.forEach(item => {
    smc.addCoverage(item);
  });

  return smc.getFinalCoverage();
}

module.exports = remap;
