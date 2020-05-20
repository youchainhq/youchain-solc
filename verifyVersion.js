#!/usr/bin/env node

var semver = require('semver');

var packageSolcVersion = require('./package.json').solcVersion;
var solcVersion = require('./index.js').version();

console.log('solcVersion: ' + solcVersion);
console.log('package solcVersion: ' + packageSolcVersion);

if (semver.eq(packageSolcVersion, solcVersion)) {
  console.log('Version matching');
  process.exit(0);
} else {
  console.log('Version mismatch');
  process.exit(1);
}
