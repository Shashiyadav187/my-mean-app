'use strict';

var app = require('./config/lib/app');

// Deprecated
var domain = require('domain').create();

// Domain emits 'error' when it's given an unhandled error
domain.on('error', function (err) {
  console.log('Some unexpected error occurs.');
  console.log(err.stack);
  try {
    var killtimer = setTimeout(function () { process.exit(1); }, 3000);
    killtimer.unref();
  } catch (er2) {
    console.log('Internal server error 500!', er2.stack);
  }
});

domain.run(function () {
  app.start();
});
