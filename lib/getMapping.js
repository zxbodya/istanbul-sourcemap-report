const { SourceMapConsumer } = require('source-map');

function normLocation(loc) {
  return {
    line: Math.max(loc.line, 1),
    column: Math.max(loc.column, 0),
  };
}

function getMapping(sourceMap, location) {
  const start = sourceMap.originalPositionFor(
    normLocation(location.start)
  );

  const end = sourceMap.originalPositionFor(
    normLocation(location.end)
  );

  if (!start.source || !end.source || start.source !== end.source) {
    return null;
  }

  if (start.line === null || start.column === null) {
    return null;
  }

  if (end.line === null || end.column === null) {
    return null;
  }

  // incorrect for case when using default parameters in function, transpiled via babel:
  //
  //     (url, state = null, title = null) => {
  //           window.history.pushState(state, title, url);
  //           next('push');
  //     }
  //
  // if (start.line === end.line && start.column === end.column) {
  //   const newEnd = sourceMap.originalPositionFor({
  //     line: location.end.line,
  //     column: location.end.column,
  //     bias: SourceMapConsumer.LEAST_UPPER_BOUND,
  //   });
  //
  //   if (newEnd.source && newEnd.line !== null && newEnd.column !== null) {
  //     end = newEnd;
  //     end.column = end.column - 1;
  //   }
  // }

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
