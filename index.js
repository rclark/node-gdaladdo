var gdal = require('gdal');
var path = require('path');
var _ = require('underscore');

module.exports = function(filepath, levels, options) {
  options = options || {};

  // Check that options are valid
  var allowed = ['resampling', 'bands', 'readonly'];
  for (var k in options) if (allowed.indexOf(k) === -1)
    throw new Error(k + ' is not an allowed option');

  // Check that resampling method is valid, defaults to nearest
  var methods = ['NEAREST', 'GAUSS', 'CUBIC', 'AVERAGE', 'MODE', 'AVERAGE_MAGPHASE', 'NONE'];
  var resampling = options.resampling ? options.resampling.toUpperCase() : 'NEAREST';
  if (resampling && methods.indexOf(resampling) < 0)
    throw new Error(resampling + ' is not a valid resampling method');

  // Check that levels are valid
  if (!Array.isArray(levels))
    throw new Error('levels must be an array of integers');

  levels = levels.map(function(level) { return Number(level); });
  if (levels.filter(function(level) { return level % 1 !== 0; }).length)
    throw new Error('levels must be an array of integers');

  // Open the file and make a determination of where overviews will live
  var ds = gdal.open(path.resolve(filepath));
  if (ds.driver.description === 'GTiff') {
    var mode = options.readonly ? 'r' : 'r+';
    ds = gdal.open(path.resolve(filepath), mode);
  }

  // Check that the file is a raster
  if (!ds.rasterSize)
    return callback(new Error('must be a raster file'));

  // Check that bands are valid
  var bands = options.bands;
  if (bands) {
    if (!Array.isArray(bands))
      throw new Error('bands must be an array of integers');

    var valid = _.range(1, ds.bands.count());

    bands = bands.map(function(band) { return Number(band); });
    if (bands.filter(function(band) {
      return band % 1 !== 0 && valid.indexOf(band) < 0;
    }).length)
      throw new Error('bands must be an array of integers');

    if (bands.length !== ds.bands.count())
      throw new Error('overview creation on a subset of bands is not supported');
  }

  ds.buildOverviews(resampling, levels, bands);
};
