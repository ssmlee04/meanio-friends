"use strict";

/*
 * Defining the Package
 */
var Module = require("meanio").Module;
  // favicon = require("serve-favicon");

var FriendsPackage = new Module("meanio-friends");

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
FriendsPackage.register(function(app, auth, database) {

  //We enable routing. By default the Package Object is passed to the routes

  FriendsPackage.routes(app, auth, database);

  return FriendsPackage;
});
