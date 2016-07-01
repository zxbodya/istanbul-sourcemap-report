const path = require('path');
const fs = require('fs');
const { Collector } = require('istanbul');
const MemoryStore = require('istanbul/lib/store/memory');
const remap = require('./remap');

const loadCoverage = filePath => JSON.parse(fs.readFileSync(filePath));

describe('remap', () => {
  it('remapping', () => {
    const coverage = remap(loadCoverage('spec/fixtures/coverage.json'));
    expect(coverage instanceof Collector).toBeTruthy();

    expect(coverage.store.map['spec/fixtures/basic.ts']).toBeTruthy();
    expect(Object.keys(coverage.store.map).length).toEqual(1);

    const map = JSON.parse(coverage.store.map['spec/fixtures/basic.ts']);
    expect(map.path, 'spec/fixtures/basic.ts');
    expect(Object.keys(map.statementMap).length).toEqual(28);
    expect(Object.keys(map.fnMap).length).toEqual(6);
    expect(Object.keys(map.branchMap).length).toEqual(6);
  });

  it('base64 source map', () => {
    const coverage = remap(loadCoverage('spec/fixtures/inline-coverage.json'));
    expect(coverage instanceof Collector).toBeTruthy();

    expect(coverage.store.map['spec/fixtures/basic.ts']).toBeTruthy();
    expect(Object.keys(coverage.store.map).length).toEqual(1);

    const map = JSON.parse(coverage.store.map['spec/fixtures/basic.ts']);
    expect(map.path, 'spec/fixtures/basic.ts');
    expect(Object.keys(map.statementMap).length).toEqual(28);
    expect(Object.keys(map.fnMap).length).toEqual(6);
    expect(Object.keys(map.branchMap).length).toEqual(6);
  });


  it('base64 source map with sources', () => {
    const store = new MemoryStore();
    remap(loadCoverage('spec/fixtures/coverage-inlinesource.json'), {
      sources: store,
    });

    expect(store.map['spec/fixtures/inlinesource.ts']).toBeTruthy();
  });

  it('coverage includes code', () => {
    const coverage = remap(loadCoverage('spec/fixtures/coverage-code.json'));
    expect(coverage instanceof Collector).toBeTruthy();
    expect(coverage.store.map['spec/fixtures/inlinesource.ts']).toBeTruthy();

    const map = JSON.parse(coverage.store.map['spec/fixtures/inlinesource.ts']);
    expect(typeof map.code).toEqual('string');
  });

  it('coverage includes code as array', () => {
    const coverage = remap(loadCoverage('spec/fixtures/coverage-code-array.json'));
    expect(coverage instanceof Collector).toBeTruthy();
    expect(coverage.store.map['spec/fixtures/inlinesource.ts']).toBeTruthy();

    const map = JSON.parse(coverage.store.map['spec/fixtures/inlinesource.ts']);
    expect(Array.isArray(map.code)).toBeTruthy();
  });

  it('empty options', () => {
    expect(remap).toThrow();
  });

  it('missing coverage source', () => {
    const warnStack = [];

    remap(loadCoverage('spec/fixtures/badcoverage.json'), {
      warn(...args) {
        warnStack.push(args);
      },
    });

    expect(warnStack.length).toEqual(2);

    expect(warnStack[0][0] instanceof Error).toBeTruthy();
    expect(warnStack[0][0].message).toEqual('Could not find file: "spec/fixtures/bad.js"');

    expect(warnStack[1][0] instanceof Error).toBeTruthy();
    expect(warnStack[1][0].message).toEqual('Could not find source map for: "spec/fixtures/bad.js"');
  });

  it('missing source map', () => {
    const coverage = loadCoverage('spec/fixtures/missingmapcoverage.json');
    expect(() => {
      remap(coverage);
    }).toThrow();
  });

  it('unicode in map', () => {
    const coverage = remap(loadCoverage('spec/fixtures/coverage-unicode.json'));

    expect(coverage.store.map['spec/fixtures/unicode.ts']).toBeTruthy();
    expect(Object.keys(coverage.store.map).length).toEqual(1);
  });

  it('skip in source map', () => {
    const coverage = remap(loadCoverage('spec/fixtures/coverage-skip.json'));

    const coverageData = JSON.parse(coverage.store.map['spec/fixtures/basic.ts']);
    expect(coverageData.statementMap['18'].skip).toEqual(true);
    expect(coverageData.statementMap['1'].skip).toEqual(undefined);
    expect(coverageData.fnMap['5'].skip).toEqual(true);
    expect(coverageData.fnMap['1'].skip).toEqual(undefined);
  });

  it('lineless items in source map should not error', () => {
    remap(loadCoverage('spec/fixtures/nosourceline.json'));
  });

  it('non transpiled coverage', () => {
    const warnStack = [];

    const coverage = remap(loadCoverage('spec/fixtures/coverage-import.json'), {
      warn(...args) {
        warnStack.push(args);
      },
    });

    const coverageData = JSON.parse(coverage.store.map['spec/fixtures/foo.js']);
    expect(coverageData.statementMap['1'].start.line).toEqual(1);
    expect(warnStack.length).toEqual(1);

    expect(warnStack[0][0] instanceof Error).toBeTruthy();
    expect(warnStack[0][0].message).toEqual('Could not find source map for: "spec/fixtures/foo.js"');
  });

  it('exclude - string', () => {
    const warnStack = [];

    remap(loadCoverage('spec/fixtures/coverage-import.json'), {
      warn(...args) {
        warnStack.push(args);
      },
      exclude: 'foo.js',
    });

    expect(warnStack.length).toEqual(1);
    expect(warnStack[0][0]).toEqual('Excluding: "spec/fixtures/foo.js"');
  });

  it('exclude - RegEx', () => {
    const warnStack = [];

    remap(loadCoverage('spec/fixtures/coverage-import.json'), {
      warn(...args) {
        warnStack.push(args);
      },
      exclude: /foo\.js$/,
    });

    expect(warnStack.length).toEqual(1);
    expect(warnStack[0][0]).toEqual('Excluding: "spec/fixtures/foo.js"');
  });

  it('useAbsolutePaths', () => {
    const coverage = remap(loadCoverage('spec/fixtures/coverage.json'), {
      useAbsolutePaths: true,
    });

    const absoluteKey = path.resolve(process.cwd(), 'spec/fixtures/basic.ts');
    expect(coverage.store.map[absoluteKey]).toBeTruthy();
    expect(Object.keys(coverage.store.map).length).toEqual(1);
  });
});
