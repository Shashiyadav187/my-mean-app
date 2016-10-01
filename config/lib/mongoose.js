'use strict';

/**
 * Module dependencies.
 */

var config = require('../config'),
  chalk = require('chalk'),
  path = require('path'),
  mongoose = require('mongoose');


module.exports.loadModels = function (callback) {
  config.files.server.models.forEach(function (modelPath) {
    require(path.resolve(modelPath));
  });

  if (callback) callback();
};

module.exports.connect = function (callback) {
  var db = mongoose.connect(config.db.uri, config.db.options, function (err) {
    if (err) {
      console.error(chalk.red('Could not connect to MongoDB!'));
      console.error(err);
    } else {

      // Enabling mongoose debug mode if required
      mongoose.set('debug', config.db.debug);

      if (callback) callback(db);
    }
  });
};

module.exports.disconnect = function (callback) {
  mongoose.disconnect(function (err) {
    console.info(chalk.yellow('Disconnected from MongoDB.'));
    callback(err);
  });
};
