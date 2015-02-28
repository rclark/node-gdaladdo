var test = require('tape');
var gdaladdo = require('..');
var path = require('path');
var os = require('os');
var crypto = require('crypto');
var fs = require('fs');
var queue = require('queue-async');
var gdal = require('gdal');

var fixtures = {
  clean: path.resolve(__dirname, 'fixtures', 'no-overviews.tif'),
  overviews: path.resolve(__dirname, 'fixtures', 'has-overviews.tif'),
  jpg: path.resolve(__dirname, 'fixtures', 'not-tiff.jpg'),
  geojson: path.resolve(__dirname, 'fixtures', 'invalid.geojson'),
  txt: path.resolve(__dirname, 'fixtures', 'invalid.txt')
};

function tmp(fixture, callback) {
  var ext = path.extname(fixture);
  var tmpfile = path.join(os.tmpdir(), crypto.randomBytes(8).toString('hex') + ext);
  fs.createReadStream(fixture)
    .pipe(fs.createWriteStream(tmpfile))
    .on('finish', function() {
      callback(null, tmpfile);
    });
}

test('[gdaladdo] invalid options', function(assert) {
  tmp(fixtures.clean, function(err, fixture) {
    var levels = [2];
    assert.throws(function() {
      gdaladdo(fixture, levels, { ham: 'and eggs' });
    }, 'throws an error');
    fs.unlink(fixture);
    assert.end();
  });
});

test('[gdaladdo] invalid resampling method', function(assert) {
  tmp(fixtures.clean, function(err, fixture) {
    var levels = [2];
    assert.throws(function() {
      gdaladdo(fixture, levels, { resampling: 'ham' });
    }, 'throws an error');
    fs.unlink(fixture);
    assert.end();
  });
});

test('[gdaladdo] levels is not an array', function(assert) {
  tmp(fixtures.clean, function(err, fixture) {
    var levels = 2;
    assert.throws(function() {
      gdaladdo(fixture, levels);
    }, 'throws an error');
    fs.unlink(fixture);
    assert.end();
  });
});

test('[gdaladdo] levels is not an array of integers', function(assert) {
  tmp(fixtures.clean, function(err, fixture) {
    var levels = [2, 'ham'];
    assert.throws(function() {
      gdaladdo(fixture, levels);
    }, 'throws an error');
    fs.unlink(fixture);
    assert.end();
  });
});

test('[gdaladdo] invalid file', function(assert) {
  tmp(fixtures.txt, function(err, fixture) {
    var levels = [2];
    assert.throws(function() {
      gdaladdo(fixture, levels);
    }, 'throws an error');
    fs.unlink(fixture);
    assert.end();
  });
});

test('[gdaladdo] vector file', function(assert) {
  tmp(fixtures.geojson, function(err, fixture) {
    var levels = [2];
    assert.throws(function() {
      gdaladdo(fixture, levels);
    }, 'throws an error');
    fs.unlink(fixture);
    assert.end();
  });
});

test('[gdaladdo] bands is not an array', function(assert) {
  tmp(fixtures.clean, function(err, fixture) {
    var levels = [2];
    assert.throws(function() {
      gdaladdo(fixture, levels, { bands: 1 });
    }, 'throws an error');
    fs.unlink(fixture);
    assert.end();
  });
});

test('[gdaladdo] bands is not an array of integers', function(assert) {
  tmp(fixtures.clean, function(err, fixture) {
    var levels = [2];
    assert.throws(function() {
      gdaladdo(fixture, levels, { bands: ['ham'] });
    }, 'throws an error');
    fs.unlink(fixture);
    assert.end();
  });
});

test('[gdaladdo] invalid band specified', function(assert) {
  tmp(fixtures.clean, function(err, fixture) {
    var levels = [2];
    assert.throws(function() {
      gdaladdo(fixture, levels, { bands: [7] });
    }, 'throws an error');
    fs.unlink(fixture);
    assert.end();
  });
});

test('[gdaladdo] resampling methods', function(assert) {
  var q = queue();
  var methods = ['NEAREST', 'GAUSS', 'CUBIC', 'AVERAGE', 'MODE', 'AVERAGE_MAGPHASE', 'NONE'];

  methods.forEach(function(method) {
    q.defer(function(next) {
      tmp(fixtures.clean, function(err, fixture) {
        assert.doesNotThrow(function() {
          gdaladdo(fixture, [2], { resampling: method });
        }, method + ' creates overviews');
        fs.unlink(fixture);
        next();
      });
    });
  });

  q.awaitAll(function(err) {
    assert.ifError(err, 'no errors');
    assert.end();
  });
});

test('[gdaladdo] new overviews in tif file', function(assert) {
  tmp(fixtures.clean, function(err, fixture) {
    var levels = [2];
    assert.doesNotThrow(function() {
      gdaladdo(fixture, levels);
    }, 'creates overviews');

    var ds = gdal.open(fixture);
    ds.bands.forEach(function(band) {
      assert.equal(band.overviews.count(), 1, 'band ' + band.id + ' has overviews');
    });
    ds.close();

    fs.unlink(fixture);
    assert.end();
  });
});

test('[gdaladdo] new overviews in sidecar for jpeg file', function(assert) {
  tmp(fixtures.jpg, function(err, fixture) {
    var levels = [2];
    assert.doesNotThrow(function() {
      gdaladdo(fixture, levels, { readonly: true });
    }, 'creates overviews');

    var ds = gdal.open(fixture);
    ds.bands.forEach(function(band) {
      assert.equal(band.overviews.count(), 1, 'band ' + band.id + ' has overviews');
    });
    ds.close();

    var tmpdir = path.dirname(fixture);
    fs.readdir(tmpdir, function(err, files) {
      files = files.filter(function(filename) {
        return filename.indexOf(path.basename(fixture, path.extname(fixture))) === 0;
      });

      assert.equal(files.length, 2, 'creates sidecar overview file');

      files.forEach(function(filename) {
        fs.unlink(path.join(tmpdir, filename));
      });

      assert.end();
    });
  });
});

test('[gdaladdo] new overviews in sidecar for tiff file', function(assert) {
  tmp(fixtures.clean, function(err, fixture) {
    var levels = [2];
    assert.doesNotThrow(function() {
      gdaladdo(fixture, levels, { readonly: true });
    }, 'creates overviews');

    var ds = gdal.open(fixture);
    ds.bands.forEach(function(band) {
      assert.equal(band.overviews.count(), 1, 'band ' + band.id + ' has overviews');
    });
    ds.close();

    var tmpdir = path.dirname(fixture);
    fs.readdir(tmpdir, function(err, files) {
      files = files.filter(function(filename) {
        return filename.indexOf(path.basename(fixture, path.extname(fixture))) === 0;
      });

      assert.equal(files.length, 2, 'creates sidecar overview file');

      files.forEach(function(filename) {
        fs.unlink(path.join(tmpdir, filename));
      });

      assert.end();
    });
  });
});

test('[gdaladdo] already has overviews', function(assert) {
  // Fixture starts with 4 overview levels, level 12 is a new one, so should have 5 total
  tmp(fixtures.overviews, function(err, fixture) {
    var levels = [12];
    assert.doesNotThrow(function() {
      gdaladdo(fixture, levels);
    }, 'creates overviews');

    var ds = gdal.open(fixture);
    ds.bands.forEach(function(band) {
      assert.equal(band.overviews.count(), 5, 'band ' + band.id + ' has overviews');
    });
    ds.close();

    fs.unlink(fixture);
    assert.end();
  });
});

// https://github.com/naturalatlas/node-gdal/issues/89
// test('[gdaladdo] overviews for subset of bands', function(assert) {
//   tmp(fixtures.clean, function(err, fixture) {
//     assert.doesNotThrow(function() {
//       gdaladdo(fixture, [2, 4, 8], { bands: [2] });
//     }, 'creates overviews');
//
//     var ds = gdal.open(fixture);
//     ds.bands.forEach(function(band) {
//       var expected = band.id === 2 ? 3 : 0;
//       assert.equal(band.overviews.count(), expected, 'band ' + band.id + ' has overviews');
//     });
//     ds.close();
//
//     fs.unlink(fixture);
//     assert.end();
//   });
// });
