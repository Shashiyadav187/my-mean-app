'use strict';

var _ = require('lodash'),
  config = require('../config'),
  mongoose = require('mongoose'),
  chalk = require('chalk'),
  crypto = require('crypto');

// global seed options object

var seedOptions = {};

function saveUser (user) {
  return function () {
    return new Promise(function (resolve, reject) {
      user.save(function (err, theuser) {
        if (err) {
          reject(new Error('Failed to add local ' + user.username));
        } else {
          resolve(theuser);
        }
      });
    });
  };
}

function removeUser (user) {
  return new Promise(function (resolve, reject) {
    var User = mongoose.model('User');
    User.find({ username: user.username }).remove(function (err) {
      if (err) {
        reject(new Error(' Failed to remove local ' + user.username));
      }
      resolve();
    });
  });
}

function checkUserNotExists (user) {
  return new Promise(function (resolve, reject) {
    var User = mongoose.model('User');
    User.find({ username: user.username }, function (err, users) {
      if (err) {
        reject(new Error('Failed to find local account ' + user.username));
      }

      if (users.length === 0) {
        resolve();
      } else {
        reject(new Error('Failed due to local account already exists: ' + user.username));
      }
    });
  });
}

function reportSuccess (password) {
  return function (user) {
    return new Promise(function (resolve, reject) {
      if (seedOptions.logResults) {
        console.log(chalk.bold.red('Database Seeding:\t\t\tLocal ' + user.username + ' added with password set to ' + password));
      }
      resolve();
    });
  };
}

function reportError (reject) {
  return function (err) {
    if (seedOptions.logResults) {
      console.log();
      console.log('Database Seeding:\t\t\t' + err);
      console.log();
    }
    reject(err);
  };
}

function seedTheUser(user) {
  return function (password) {
    return new Promise(function (resolve, reject) {

      var User = mongoose.model('User');
      user.password = password;

      if (user.username === seedOptions.seedAdmin.username && process.env.NODE_ENV === 'production') {
        checkUserNotExists(user)
        .then(saveUser(user))
        .then(reportSuccess(password))
        .then(function () {
          resolve();
        })
        .catch(function (err) {
          reject(err);
        });
      } else {
        removeUser(user)
          .then(saveUser(user))
          .then(reportSuccess(password))
          .then(function () {
            resolve();
          })
          .catch(function (err) {
            reject(err);
          });
      }
    });
  };
}

module.exports.start = function start(options) {
  seedOptions = _.clone(config.seedDB.options, true);

  if (_.has(options, 'logResults')) {
    seedOptions.logResults = options.logResults;
  }

  if (_.has(options, 'seedUser')) {
    seedOptions.seedUser = options.seedUser;
  }

  if (_.has(options, 'seedAdmin')) {
    seedOptions.seedAdmin = options.seedAdmin;
  }

  var User = mongoose.model('User');
  return new Promise(function (resolve, reject) {
    var adminAccount = new User(seedOptions.seedAdmin);
    var userAccount = new User(seedOptions.seedUser);

    // seed only admin for production env, if it does not exist
    if (process.env.NODE_ENV === 'production') {
      User.generateRandomPassphrase()
        .then(seedTheUser(adminAccount))
        .then(function () {
          resolve();
        })
        .catch(reportError(reject));
    } else {
      // Add both admin and user for other env
      User.generateRandomPassphrase()
        .then(seedTheUser(userAccount))
        .then(User.generateRandomPassphrase)
        .then(seedTheUser(adminAccount))
        .then(function () {
          resolve();
        })
        .catch(reportError(reject));
    }
  });
};
