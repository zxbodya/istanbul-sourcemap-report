# Istanbul coverage report source mapping utility

[![Build Status](https://travis-ci.org/zxbodya/istanbul-sourcemap-report.svg?branch=master)](https://travis-ci.org/zxbodya/istanbul-sourcemap-report)

Utility to generate coverage reports for sources from compiled code coverage using SourceMaps.

Opinionated fork from `remap-istanbul`(https://github.com/SitePen/remap-istanbul). 

My goals were following:

 - split to smaller, more maintainable files
 - change some implementation details, and interfaces I do not like
 - resolve some issues I have
 - change testing framework
 - update to es6
 - make better cli util
 
Also there is one big thing that need to be done - make unit test coverage, instead of functional as it is now.
Have not done yet - just converted to jasmine.

BTW - I also removed grunt and gulp plugins from project, because I think it should be separate packages. 

## Usage

### Install

`npm install istanbul-sourcemap-report`

### CLI

`istanbul-sourcemap-report ./coverage/coverage.json --json.file=./coverage/coverage-remapped.json --html.dir=./coverage/coverage-remapped`

Possible options:

  - `--exclude=<glob>` - glob expression for files to exclude 
  - `--<report-type>.<option>=<value>` - options for reporters
  - `--<report-type>` - enable report type (not required if there is options for report type)
  - everything else is treated as input coverage files

### Node module

```
const remap = require('istanbul-sourcemap-report');

remap([
  // coverage files for mapping to sources
  './coverage/coverage.json'
], {
  // reporters configuration
  json: { file: './coverage/coverage-remapped.json' },
  html: { dir: './coverage/coverage-remapped' },
}, {
  // remapping options
  //    exclude?  - glob expression using minimatch
  //    readFile? - a function that can read a file
  //                syncronously
  //    readJSON? - a function that can read and parse a
  //                JSON file syncronously
  //    sources?  - a Istanbul store where inline sources will be
  //                added
  //    warn?     - a function that logs warnings
});
```
