const path = require('path');
const fs = require('fs');
const { SourceMapConsumer } = require('source-map');

const sourceMapRegEx = /(?:\/{2}[#@]{1,2}|\/\*)\s+sourceMappingURL\s*=\s*(data:(?:[^;]+;)+base64,)?(\S+)/;

const getMapping = require('./getMapping');

class MappingProvider {
  constructor(options, sparceCoverageCollector) {
    this.sparceCoverageCollector = sparceCoverageCollector;
    this.useAbsolutePaths = !!options.useAbsolutePaths;

    this.warn = options.warn || console.warn;

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
  }

  getMappingResolver(filePath, code = false) {
    /* coverage.json can sometimes include the code inline */
    let codeIsArray = true;
    let jsText = code || this.readFile(filePath);
    if (Array.isArray(jsText)) { /* sometimes the source is an array */
      jsText = jsText.join('\n');
    } else {
      codeIsArray = false;
    }

    const match = sourceMapRegEx.exec(jsText);
    let sourceMapDir = path.dirname(filePath);
    let rawSourceMap;

    if (!match) {
      return false;
    }

    if (match[1]) {
      rawSourceMap = JSON.parse((new Buffer(match[2], 'base64').toString('utf8')));
    } else {
      const sourceMapPath = path.join(sourceMapDir, match[2]);
      rawSourceMap = this.readJSON(sourceMapPath);
      sourceMapDir = path.dirname(sourceMapPath);
    }


    // replace relative paths in source maps with absolute
    rawSourceMap.sources = rawSourceMap.sources.map(
      (srcPath) => {
        let resolvedSource = path.resolve(sourceMapDir, srcPath);

        if (!this.useAbsolutePaths) {
          resolvedSource = path.relative(process.cwd(), resolvedSource);
        }
        return resolvedSource;
      }
    );

    const sourceMap = new SourceMapConsumer(rawSourceMap);

    /* if there are inline sources and a store to put them into, we will populate it */
    if (sourceMap.sourcesContent) {
      sourceMap.sourcesContent.forEach((source, idx) => {
        this.sparceCoverageCollector.setSourceCode(
          sourceMap.sources[idx],
          codeIsArray ? source.split('\n') : source
        );
        if (this.sourceStore) {
          this.sourceStore.set(sourceMap.sources[idx], source);
        }
      });
    }

    return (location) => getMapping(sourceMap, location);
  }
}

module.exports.MappingProvider = MappingProvider;
