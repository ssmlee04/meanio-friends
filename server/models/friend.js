/*jshint -W079 */
"use strict";

/**
 * Module dependencies.
 */
var Promise = require("bluebird");
var _ = require("lodash");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var FriendFriendSchema = new Schema({
  user_id : { 
    type: Schema.Types.ObjectId, 
    ref: "User" 
  },
  user: {},
  status : {  // 1 added, 2 other added, 3 mutual confirm
    type: Number 
  },  
  createdAt : { 
    type: Date, 
    default: Date.now 
  }
});

var FriendSchema = new Schema({
  user_id : { 
    type: Schema.Types.ObjectId, 
    ref: "User" 
  },
  friends : [FriendFriendSchema]
}, {
  timestamps: true,
  collection: "oc_friends"
});

var SENT_REQUEST_STATUS = 1;
var RECEIVED_REQUEST_STATUS = 2;
var MUTUAL_STATUS = 3;

var checkUserExist = function(d) {
  if (!d || !d._id) {
    return Promise.reject("not a valid user");
  }
  this.user = _.pick(JSON.parse(JSON.stringify(d)), "name", "email", "avatar")
  return d;
};

var checkTargetExist = function(d) {
  if (!d || !d._id) {
    return Promise.reject("not a valid user");
  }
  this.target = _.pick(JSON.parse(JSON.stringify(d)), "name", "email", "avatar")
  return d;
};

FriendSchema.statics.__insert = function(userId) {
  var that = this;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return Promise.reject("not a valid user id");
  }

  return Promise.cast(that.findOne({user_id: userId}).exec())
  .then(function(d) {
    if (!d) {
      return Promise.cast(that.create({user_id: userId}));
    }
  });
};

FriendSchema.statics.load = function(userId) {
  var that = this;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return Promise.reject("not a valid user id");
  }

  return Promise.cast(that.findOne({user_id: userId}).lean().exec())
  .then(function(d) {
    d = JSON.parse(JSON.stringify(d));
    return d && d.friends || [];
  });
};

FriendSchema.statics.add = function(userId, targetId) {
  var that = this;
  var oldUserTargetStatus = 0;
  var oldTargetUserStatus = 0;
  var newTargetUserStatus = 0;
  var newUserTargetStatus = 0;
  var User = mongoose.model("User");
  var Notification = mongoose.model("Notification");

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return Promise.reject("text-error-user");
  }
  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return Promise.reject("text-error-target-user");
  }
  if (userId === targetId) {
    return Promise.reject("text-error-add-user-self");
  }

  return Promise.resolve().bind({})
  .then(function() {
    return User.load(userId).bind(this).then(checkUserExist)
  }).then(function() {
    return User.load(targetId).bind(this).then(checkTargetExist)
  }).then(function() {
    return that.__insert(targetId);
  }).then(function() {
    return that.__insert(userId);
  }).then(function() {
    return Promise.resolve().bind(this)
    .then(function() {
      return that.load(userId).then(function(d) {
        d.map(function(d) {
          if (d.user_id === targetId) {
            oldUserTargetStatus = d.status;
          }
        });
      });
    }).then(function() {
      return that.load(targetId).then(function(d) {
        d.map(function(d) {
          if (d.user_id === userId) {
            oldTargetUserStatus = d.status;
          }
        });
      });
    }).then(function() {
      if (oldTargetUserStatus === 3 && oldTargetUserStatus === 3) {
        return Promise.reject("text-already-friedns");
      }
    }).then(function() {
      return Promise.resolve().bind(this)
      .then(function() {
        if (oldTargetUserStatus === 1) {
          newUserTargetStatus = MUTUAL_STATUS;
          return Promise.cast(that.update({user_id: userId, "friends.user_id" : targetId}, {"friends.$" : {user: this.target, status: MUTUAL_STATUS, user_id: targetId}}).exec());
        } else { // 0, 2 case
          newUserTargetStatus = SENT_REQUEST_STATUS;
          return Promise.cast(that.update({user_id: userId, "friends.user_id" : {$nin: [targetId]}}, {$push: {"friends" : {user: this.target, status: SENT_REQUEST_STATUS, user_id: targetId}}}).exec());
        }
      }).then(function() {
        if (oldTargetUserStatus === 1) {
          newTargetUserStatus = MUTUAL_STATUS;
          return Promise.cast(that.update({user_id: targetId, "friends.user_id" : userId}, {"friends.$" : {user: this.user, status: MUTUAL_STATUS, user_id: userId}}).exec());
        } else { // 0, 2 case
          newTargetUserStatus = RECEIVED_REQUEST_STATUS;
          return Promise.cast(that.update({user_id: targetId, "friends.user_id" : {$nin: [userId]}}, {$push: {"friends" : {user: this.user, status: RECEIVED_REQUEST_STATUS, user_id: userId}}}).exec());
        }
      }).then(function() {
        if (Notification) {
          if (newTargetUserStatus === 3) {
            return Notification._insertFriendMutualReceivedNotification(targetId, userId);
          } else if (newTargetUserStatus === 2) {
            return Notification._insertFriendRequestReceivedNotification(targetId, userId);
          }
        }
      }).then(function() {
        if (newUserTargetStatus === 3 && newTargetUserStatus === 3 && oldUserTargetStatus < 3 && oldTargetUserStatus < 3) {
          return Promise.resolve()
          .then(function() {
            return User.update({_id: userId}, {$inc: {"stats.n_friends" : 1}}).exec();
          }).then(function() {
            return User.update({_id: targetId}, {$inc: {"stats.n_friends" : 1}}).exec();
          });
        }
      })
    })
  });
};

FriendSchema.statics.delete = function(userId, targetId) {
  var that = this;
  var oldUserTargetStatus = 0;
  var oldTargetUserStatus = 0;
  var User = mongoose.model("User");

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return Promise.reject("text-error-user");
  }
  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return Promise.reject("text-error-target-user");
  }
  if (userId === targetId) {
    return Promise.reject("text-error-add-user-self");
  }

  return Promise.resolve()
  .then(function() {
    return that.__insert(targetId);
  }).then(function() {
    return that.__insert(userId);
  }).then(function() {
    return Promise.resolve()
    .then(function() {
      return that.load(userId).then(function(d) {
        d.map(function(d) {
          if (d.user_id.toString() === targetId.toString()) {
            oldUserTargetStatus = d.status;
          }
        });
      });
    }).then(function() {
      return that.load(targetId).then(function(d) {
        d.map(function(d) {
          if (d.user_id.toString() === userId.toString()) {
            oldTargetUserStatus = d.status;
          }
        });
      });
    }).then(function() {
      return Promise.resolve()
      .then(function() {
        if (oldUserTargetStatus > 0) {
          return Promise.cast(that.update({user_id: userId, "friends.user_id" : {$in: [targetId]}}, {$pull: {"friends" : {user_id: targetId}}}).exec());
        } 
      }).then(function() {
        if (oldTargetUserStatus > 0) {
          return Promise.cast(that.update({user_id: targetId, "friends.user_id" : {$in: [userId]}}, {$pull: {"friends" : {user_id: userId}}}).exec());
        } 
      }).then(function() {
        if (oldUserTargetStatus === 3 && oldTargetUserStatus === 3) {
          return Promise.resolve()
          .then(function() {
            return User.update({_id: targetId}, {$inc: {"stats.n_friends" : -1}}).exec();
          }).then(function() {
            return User.update({_id: userId}, {$inc: {"stats.n_friends" : -1}}).exec();
          });
        }
      })
    })
  });
};

mongoose.model("Friend", FriendSchema);
