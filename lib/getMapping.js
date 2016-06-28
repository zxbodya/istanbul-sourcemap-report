const { SourceMapConsumer } = require('source-map/lib/source-map-consumer');


function getMapping(sourceMap, location) {
  if (location.start.line < 1 || location.start.column < 0) {
    return null;
  }

  if (location.end.line < 1 || location.end.column < 0) {
    return null;
  }

  const start = sourceMap.originalPositionFor(location.start);
  let end = sourceMap.originalPositionFor(location.end);

  if (!start || !end) {
    return null;
  }
  if (!start.source || !end.source || start.source !== end.source) {
    return null;
  }

  if (start.line === null || start.column === null) {
    return null;
  }

  if (end.line === null || end.column === null) {
    return null;
  }

  if (start.line === end.line && start.column === end.column) {
    end = sourceMap.originalPositionFor({
      line: location.end.line,
      column: location.end.column,
      bias: SourceMapConsumer.LEAST_UPPER_BOUND,
    });
    end.column = end.column - 1;
  }

  return {
    source: start.source,
    loc: {
      start: {
        line: start.line,
        column: start.column,
      },
      end: {
        line: end.line,
        column: end.column,
      },
      skip: location.skip,
    },
  };
}

module.exports = getMapping;
