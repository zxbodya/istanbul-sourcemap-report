#!/usr/bin/env node

const fs = require('fs');
const remap = require('./index');

const types = new Set([
  'clover',
  'cobertura',
  'html',
  'json',
  'json-summary',
  'lcov',
  'lcovonly',
  'none',
  'teamcity',
  'text',
  'text-lcov',
  'text-summary',
]);


const sources = [];
const reports = {};
const remapOptions = {};

const optionRegExp = /^--([^=.]+)\.?([^=]*)=?(.*)$/;

process.argv.slice(2).forEach(arg => {
  const m = arg.match(optionRegExp);
  if (m) {
    const type = m[1];
    const prop = m[2];
    const propValue = m[3];

    if (type === 'exclude') {
      remapOptions.exclude = m[3];
      return;
    }

    if (types.has(type)) {
      if (!reports[type]) {
        reports[type] = {};
      }
      if (prop && propValue) {
        reports[type][prop] = propValue;
      }
      return;
    }

    throw new Error(`Unrecognized option: ${arg}`);
  } else {
    if (fs.existsSync(arg)) {
      sources.push(arg);
    } else {
      throw new Error(`Input file not found: ${arg}`);
    }
  }
});

remap(sources, reports, remapOptions);
