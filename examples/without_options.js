var getForecast = require('../index');

getForecast('Boulder', 'CO', function(err, stream) {
  if (err) return console.error(err);

  stream.on('data', function(data) {
    console.dir(data);
  });

  stream.on('end', function(end) {
    console.log('DONE!');
  });
});
