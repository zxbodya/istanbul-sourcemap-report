const Collector = require('istanbul/lib/collector');
const path = require('path');
const fs = require('fs');
const { SourceMapConsumer } = require('source-map/lib/source-map-consumer');

const sourceMapRegEx = /(?:\/{2}[#@]{1,2}|\/\*)\s+sourceMappingURL\s*=\s*(data:(?:[^;]+;)+base64,)?(\S+)/;

const SparceCoverageCollector = require('./SparceCoverageCollector');

const getMapping = require('./getMapping');
const remapFunction = require('./remapFunction');
const remapBranch = require('./remapBranch');


class CoverageTransformer {
  constructor(options) {
    this.basePath = options.basePath;
    this.warn = options.warn || console.warn;

    this.exclude = () => false;
    if (options.exclude) {
      if (typeof options.exclude === 'string') {
        this.exclude = (fileName) => fileName.indexOf(options.exclude) > -1;
      } else {
        this.exclude = (fileName) => fileName.match(options.exclude);
      }
    }

    this.useAbsolutePaths = !!options.useAbsolutePaths;

    this.readJSON = options.readJSON
      || function readJSON(filePath) {
        if (!fs.existsSync(filePath)) {
          throw new Error(`Could not find file: "${filePath}"`);
        }
        return JSON.parse(fs.readFileSync(filePath));
      };

    this.readFile = options.readFile
      || function readFile(filePath) {
        if (!fs.existsSync(filePath)) {
          this.warn(new Error(`Could not find file: "${filePath}"`));
          return '';
        }
        return fs.readFileSync(filePath);
      };

    this.sourceStore = options.sources;

    this.sparceCoverageCollector = new SparceCoverageCollector();
  }

  addFileCoverage(filePath, fileCoverage) {
    if (this.exclude(filePath)) {
      this.warn(`Excluding: "${filePath}"`);
      return;
    }

    /* coverage.json can sometimes include the code inline */
    let codeIsArray = true;
    let jsText = fileCoverage.code || this.readFile(filePath);
    if (Array.isArray(jsText)) { /* sometimes the source is an array */
      jsText = jsText.join('\n');
    } else {
      codeIsArray = false;
    }
    const match = sourceMapRegEx.exec(jsText);
    let sourceMapDir = path.dirname(filePath);
    let rawSourceMap;

    if (!match) {
      /* We couldn't find a source map, so will copy coverage after warning. */
      this.warn(new Error(`Could not find source map for: "${filePath}"`));
      this.sparceCoverageCollector.setCoverage(filePath, fileCoverage);
      return;
    }

    if (match[1]) {
      rawSourceMap = JSON.parse((new Buffer(match[2], 'base64').toString('utf8')));
    } else {
      const sourceMapPath = path.join(sourceMapDir, match[2]);
      rawSourceMap = this.readJSON(sourceMapPath);
      sourceMapDir = path.dirname(sourceMapPath);
    }

    sourceMapDir = this.basePath || sourceMapDir;

    // replace relative paths in source maps with absolute
    rawSourceMap.sources = rawSourceMap.sources.map((srcPath) => (
      srcPath.substr(0, 1) === '.'
        ? path.resolve(sourceMapDir, srcPath)
        : srcPath
    ));

    const sourceMap = new SourceMapConsumer(rawSourceMap);

    /* if there are inline sources and a store to put them into, we will populate it */
    const inlineSourceMap = {};
    if (sourceMap.sourcesContent) {
      sourceMap.sourcesContent.forEach((source, idx) => {
        inlineSourceMap[sourceMap.sources[idx]] = true;
        this.sparceCoverageCollector.setSourceCode(
          sourceMap.sources[idx],
          codeIsArray ? source.split('\n') : source
        );
        if (this.sourceStore) {
          this.sourceStore.set(sourceMap.sources[idx], source);
        }
      });
    }

    const resolvePath = (source) => {
      let resolvedSource = source in inlineSourceMap
        ? source
        : path.resolve(sourceMapDir, source);

      if (!this.useAbsolutePaths && !(source in inlineSourceMap)) {
        resolvedSource = path.relative(process.cwd(), resolvedSource);
      }
      return resolvedSource;
    };

    const getMappingResolved = (location) => {
      const mapping = getMapping(sourceMap, location);
      if (!mapping) return null;

      return Object.assign(mapping, { source: resolvePath(mapping.source) });
    };

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
