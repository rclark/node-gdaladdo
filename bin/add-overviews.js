#!/usr/bin/env node

var gdaladdo = require('..');
var path = require('path');
var optimist = require('optimist')
  .usage('Usage: add-overviews filename levels\n  filename: The file to build overviews for\n  levels: A list of integral overview levels to build')
  .alias('r', 'resampling')
  .describe('r', '[optional] Select a resampling algorithm. One of "NEAREST", "GAUSS", "CUBIC", "AVERAGE", "MODE", "AVERAGE_MAGPHASE" or "NONE"')
  .default('r', 'NEAREST')
  // .alias('b', 'band')
  // .describe('b', '[optional] Select an input band band for overview generation. Band numbering starts from 1. Multiple -b switches may be used to select a set of input bands to generate overviews.')
  .alias('ro', 'readonly')
  .boolean('readonly')
  .describe('ro', '[optional] Open the dataset in read-only mode, in order to generate external overviews for GeoTIFFs')
  .alias('h', 'help')
  .boolean('help')
  .describe('h', 'Show this message')
  .check(function(args) {
    if (args.help) return;

    if (args._.length < 2) throw new Error('Missing filename and/or levels');

    args.filename = args._.shift();
    args.levels = args._;
    return args;
  });
var argv = optimist.argv;

if (argv.help) return optimist.showHelp();

var options = {
  resampling: argv.resampling,
  readonly: argv.readonly
};

// if (argv.bands) options.bands = Array.isArray(argv.bands) ? argv.bands : [argv.bands];

try { gdaladdo(path.resolve(argv.filename), argv.levels, options); }
catch (err) {
  console.error(err);
  process.exit(1);
}
