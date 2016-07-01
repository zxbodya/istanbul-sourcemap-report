const fs = require('fs');
const path = require('path');
const main = require('./index');
const r = to => path.resolve(process.cwd(), to);

describe('main', () => {
  it('has correct interface, and generally works', () => {
    main(['spec/fixtures/coverage.json'], {
      lcovonly: { file: 'tmp/main.lcov.info' },
      json: { file: 'tmp/main.json' },
    });

    const lcovonly = fs.readFileSync('tmp/main.lcov.info', { encoding: 'utf8' });
    expect(lcovonly).toBeTruthy();
    expect(lcovonly).toContain('SF:' + r('spec/fixtures/basic.ts'));

    const json = JSON.parse(fs.readFileSync('tmp/main.json', { encoding: 'utf8' }));
    expect(json).toBeTruthy();
    expect(json[r('spec/fixtures/basic.ts')]).toBeTruthy();
  });

  it('has correct interface, and generally works with inline sources', () => {
    main(['spec/fixtures/coverage-inlinesource.json'], {
      html: { dir: 'tmp/html-report-main' },
    });

    expect(fs.existsSync('tmp/html-report-main/fixtures/inlinesource.ts.html')).toBeTruthy();
  });
});
