/*jshint -W079 */
"use strict";

/*
 * Module dependencies.
 */
var mongoose = require("mongoose");
var Promise = require("bluebird");
var Friend = mongoose.model("Friend");

/*
 * Get other user matrics
 */
exports.add = function(req, res) {
  if (!req.user || !req.user._id) {
    return res.json(500, {error: "text-error-user"});
  }
  var targetUserId = req.body.targetUserId;
  var userId = req.user._id.toString();
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.json(500, {error: "text-error-other-user"});
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.json(500, {error: "text-error-user-id"});
  }

  return Promise.resolve()
  .then(function() {
    return Friend.add(userId, targetUserId)
  }).then(function() {
    res.json({status: "success"});
  }).catch(function(err) {
    console.log(err)
    res.json(500, {error: err.toString()})
  })
};

exports.remove = function(req, res) {
  if (!req.user || !req.user._id) {
    return res.json(500, {error: "text-error-user"});
  }
  var targetUserId = req.body.targetUserId;
  var userId = req.user._id.toString();
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.json(500, {error: "text-error-other-user"});
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.json(500, {error: "text-error-fd-user-id"});
  }

  return Promise.resolve()
  .then(function() {
    return Friend.delete(userId, targetUserId)
  }).then(function() {
    res.json({status: "success"});
  }).catch(function(err) {
    console.log(err)
    res.json(500, {error: err.toString()})
  })
};

exports.all = function(req, res) {
  if (!req.user || !req.user._id) {
    return res.json(500, {error: "text-error-user"});
  }
  var userId = req.user._id.toString();
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.json(500, {error: "text-error-other-user"});
  }

  return Friend.load(userId)
  .then(function(d) {
    return res.json(d || []);
  }).catch(function(err) {
    res.json(500, {error: "error fetching list of friends.."})
  })
};
