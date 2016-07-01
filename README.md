# Istanbul coverage report source mapping utility

Opinionated fork from `remap-istanbul`.

My goals were following:

 - split to smaller, more maintainable files
 - make unit tests instead of functional (was not done - just converted to jasmine)  
 - change some implementation details, and interfaces I do not like
 - resolve some issues I have
 - update to es6

Utility to generate coverage reports from compiled code coverage using SourceMaps 

```JS
const remap = require('remap-istanbul');

remap([
  // coverage files for mapping to sources
  './coverage/coverage.json'
], {
  // reporters configuration
  json: { file: './coverage/coverage-remapped.json' },
  html: { dir: './coverage/coverage-remapped' },
}, {
  // remapping options
  //    exclude?  - a string or Regular Expression that filters out
  //                any coverage where the file path matches
  //    readFile? - a function that can read a file
  //                syncronously
  //    readJSON? - a function that can read and parse a
  //                JSON file syncronously
  //    sources?  - a Istanbul store where inline sources will be
  //                added
  //    warn?     - a function that logs warnings
});
```
