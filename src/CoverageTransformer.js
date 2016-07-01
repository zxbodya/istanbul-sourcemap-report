const path = require('path');
const minimatch = require('minimatch');

const { Collector } = require('istanbul');

const { SparceCoverageCollector } = require('./SparceCoverageCollector');

const remapFunction = require('./remapFunction');
const remapBranch = require('./remapBranch');

const { MappingProvider } = require('./MappingProvider');

class CoverageTransformer {
  constructor(options) {
    this.warn = options.warn || console.warn;
    this.exclude = () => false;
    if (options.exclude) {
      this.exclude = (fileName) => minimatch(fileName, options.exclude);
    }

    this.sparceCoverageCollector = new SparceCoverageCollector();
    this.mappingProvider = new MappingProvider(options, this.sparceCoverageCollector);
  }

  addFileCoverage(filePath, fileCoverage) {
    const getMappingResolved = this.mappingProvider.getMappingResolver(filePath, fileCoverage.code);

    if (!getMappingResolved) {
      /* We couldn't find a source map, so will copy coverage after warning. */
      this.warn(new Error(`Could not find source map for: "${filePath}"`));
      this.sparceCoverageCollector.setCoverage(
        path.resolve(process.cwd(), filePath),
        fileCoverage
      );
      return;
    }

    Object.keys(fileCoverage.branchMap).forEach((index) => {
      const genItem = fileCoverage.branchMap[index];
      const hits = fileCoverage.b[index];

      const info = remapBranch(genItem, getMappingResolved);

      if (info) {
        this.sparceCoverageCollector.updateBranch(info.source, info.srcItem, hits);
      }
    });

    Object.keys(fileCoverage.fnMap).forEach((index) => {
      const genItem = fileCoverage.fnMap[index];
      const hits = fileCoverage.f[index];

      const info = remapFunction(genItem, getMappingResolved);

      if (info) {
        this.sparceCoverageCollector.updateFunction(info.source, info.srcItem, hits);
      }
    });

    Object.keys(fileCoverage.statementMap).forEach((index) => {
      const genItem = fileCoverage.statementMap[index];
      const hits = fileCoverage.s[index];

      const mapping = getMappingResolved(genItem);

      if (mapping) {
        this.sparceCoverageCollector.updateStatement(mapping.source, mapping.loc, hits);
      }
    });
  }

  addCoverage(item) {
    Object.keys(item)
      .forEach((filePath) => {
        if (this.exclude(filePath)) {
          this.warn(`Excluding: "${filePath}"`);
          return;
        }

        const fileCoverage = item[filePath];
        this.addFileCoverage(filePath, fileCoverage);
      });
  }

  getFinalCoverage() {
    const collector = new Collector();

    const srcCoverage = this.sparceCoverageCollector.getFinalCoverage();

    collector.add(Object.keys(srcCoverage)
      .filter((filePath) => !this.exclude(filePath))
      .reduce((obj, name) => {
        obj[name] = srcCoverage[name];
        return obj;
      }, {}));

    /* refreshes the line counts for reports */
    collector.getFinalCoverage();

    return collector;
  }
}

module.exports.CoverageTransformer = CoverageTransformer;
