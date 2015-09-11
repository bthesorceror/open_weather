var once      = require('once');
var merge     = require('merge');
var format    = require('util').format;
var request   = require('hyperquest');
var concat    = require('concat-stream');
var through   = require('through2');
var streamify = require('stream-array');

module.exports = getForecast;

function dateTranslation() {
  var options = { objectMode: true };
  var stream = through(options, function(data, enc, done) {
    data.date = new Date(data.dt * 1000);
    this.push(data);
    done();
  });

  return stream;
}

var defaultOptions = {
  numberOfDays: 5,
  units: 'imperial'
};

function buildOptions(options) {
  if (!options) {
    options = defaultOptions;
  } else {
    options = merge(defaultOptions, options);
  }

  return options;
}

function url(city, state, options) {
  var location = [city, state].join(",");
  var baseUrl = "http://api.openweathermap.org/data/2.5/forecast" +
                "/daily?q=%s&mode=json&units=%s&cnt=%s";

  options = buildOptions(options);

  return format(
    baseUrl,
    location,
    options.units,
    options.numberOfDays);
}

function createOutputStream(cb) {
  var outputStream = concat(function(output) {
    try {
      var data = JSON.parse(output);
      var stream = streamify(data.list || [])
      .pipe(dateTranslation());

      cb(null, stream);
    } catch (e) {
      cb(new Error('Could not parse json data'));
    }
  });

  return outputStream;
}

function getForecast(city, state, options, cb) {
  if (!cb) { cb = options; options = null; }

  cb = once(cb);

  var req = request(url(city, state, options));
  req.on('error', cb);

  req.on('response', function(response) {
    var outputStream = createOutputStream(cb);

    response.on('error', cb);
    response.pipe(outputStream)
  });
}
