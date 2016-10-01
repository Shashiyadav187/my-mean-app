'use strict';

/**
 * Module dependencies
 */

var config = require('../config'),
  mongoose = require('./mongoose'),
  express = require('./express'),
  chalk = require('chalk'),
  seed = require('./seed');

function seedDataBase() {
  if (config.seedDB && config.seedDB.seed) {
    console.log(chalk.bold.red('Warning: Database seeding is turned on'));
    seed.start();
  }
}

mongoose.loadModels(seedDataBase);

module.exports.init = function init(callback) {
  mongoose.connect(function (db) {
    var app = express.init(db);
    if (callback) callback(app, db, config);
  });
};

module.exports.start = function start(callback) {
  var _this = this;

  _this.init(function (app, db, config) {
    app.listen(config.port, config.host, function () {
      var server = (process.env.NODE_ENV === 'secure' ? 'https://' : 'http://') + config.host + ':' + config.port;

      console.log('--');
      console.log(chalk.green(config.app.title));
      console.log();
      console.log(chalk.green('Environment:     ' + process.env.NODE_ENV));
      console.log(chalk.green('Server:          ' + server));
      console.log(chalk.green('Database:        ' + config.db.uri));
      console.log(chalk.green('App version:     ' + config.meanjs.version));
      if (config.meanjs['meanjs-version'])
        console.log(chalk.green('MEAN.JS version: ' + config.meanjs['meanjs-version']));
      console.log('--');

      if (callback) callback(app, db, config);

    });
  });
};
