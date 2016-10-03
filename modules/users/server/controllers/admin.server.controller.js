'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  multer = require('multer'),
  fs = require('fs'),
  readline = require('readline'),
  config = require(path.resolve('./config/config')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Show the current user
 */
exports.read = function (req, res) {
  res.json(req.model);
};

/**
 * Update a User
 */
exports.update = function (req, res) {
  var user = req.model;

  // For security purposes only merge these parameters
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.displayName = user.firstName + ' ' + user.lastName;
  user.roles = req.body.roles;
  user.enabled = req.body.enabled;

  user.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(user);
  });
};

/**
 * Delete a user
 */
exports.delete = function (req, res) {
  var user = req.model;

  user.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(user);
  });
};

/**
 * List of Users
 */
exports.list = function (req, res) {
  User.find({}, '-salt -password -providerData').sort('-created').populate('user', 'displayName').exec(function (err, users) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(users);
  });
};

/**
 * User middleware
 */
exports.userByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'User is invalid'
    });
  }

  User.findById(id, '-salt -password -providerData').exec(function (err, user) {
    if (err) {
      return next(err);
    } else if (!user) {
      return next(new Error('Failed to load user ' + id));
    }

    req.model = user;
    next();
  });
};

/**
 * Create bulk users
 */
exports.createBulkUsers = function (req, res) {
  var user = req.user;
  var upload = multer(config.uploads.csvUpload).single('file');
  var bulkUserUploadFileFilter = require(path.resolve('./config/lib/multer')).bulkUserUploadFileFilter;

  // Filtering to upload only images
  upload.fileFilter = bulkUserUploadFileFilter;

  if (user) {
    uploadCSV()
      .then(readCSVFile)
      .then(insertUsers)
      .then(function () {
        res.json(user);
      })
      .catch(function (err) {
        res.status(400).send(err);
      });
  } else {
    res.status(400).send({
      message: 'User is not signed in'
    });
  }

  function uploadCSV () {
    return new Promise(function (resolve, reject) {
      upload(req, res, function (uploadError) {
        if (uploadError) {
          reject(errorHandler.getErrorMessage(uploadError));
        } else {
          resolve();
        }
      });
    });
  }

  function readCSVFile () {
    return new Promise(function (resolve, reject) {
      var csv = config.uploads.csvUpload.dest + req.file.filename;
      var usersList = [];
      var usersLine = readline.createInterface({
        input: fs.createReadStream(csv.toString())
      });

      usersLine.on('line', function(line) {
        var userData = line.split(',');
        var user = {
          firstName: userData[0],
          lastName: userData[1],
          displayName: userData[2],
          username: userData[3],
          password: userData[4],
          email: userData[5],
          provider: userData[6],
          roles: userData[7]
        };
        usersList.push(user);
      });

      usersLine.on('close', function() {
        if (usersList) {
          resolve(usersList);
        } else {
          reject(new Error('Some error occurred while reading csv file, make sure file is not empty'));
        }
      });
    });
  }

  function insertUsers(usersList) {
    return new Promise(function (resolve, reject) {
      User.insertMany(usersList, function (err) {
        if (err) {
          reject(errorHandler.getErrorMessage(err));
        } else {
          resolve();
        }
      });
    });

  }
};
