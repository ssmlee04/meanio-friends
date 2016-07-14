"use strict";

var friends = require("../controllers/friends");

module.exports = function(Friends, app, auth) {

  app.route("/apis/v1/friends")
    .get(friends.all)
    .post(auth.requiresLogin, friends.add)
    .delete(auth.requiresLogin, friends.remove);
};

