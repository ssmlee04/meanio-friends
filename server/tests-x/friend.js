/*jshint -W079 */
"use strict";

/**
 * Module dependencies.
 */
var Promise = require("bluebird");
var should = require("should");
var path = require("path");
var mongoose = require("mongoose");
var Userfriend = mongoose.model("Userfriend");
var User = mongoose.model("User");
var _ = require("lodash");
var config = require("meanio").loadConfig();
var testutils = require(path.join(config.root, "/config/testutils"));
var utils = require(path.join(config.root, "/config/utils"));

/**
 * Globals
 */
var numUsers = 2;
var users = [];
var savedusers = [];

/**
 * Test Suites
 */
describe("<Unit Test>", function() {
  describe("Model Friends:", function() {

    beforeEach(function(done) {
      return Promise.resolve()
      .then(function() {
        return Promise.cast(User.find().remove().exec());
      }).then(function() {
        return Promise.cast(Userfriend.find({}).remove().exec());
      }).then(function() {
        return Promise.resolve(_.range(numUsers))
        .map(function(d, i) {
          users[i] = testutils.genUser();
          return User.insert(users[i]).then(function(d) { 
            savedusers[i] = JSON.parse(JSON.stringify(d));
          });
        })
      }).then(function() {
        done();
      })
    });

    describe("Method Create", function() {
      it("should be able to friend / unfriend (add, delete)", function(done) {
        return Promise.resolve()
        .then(function() {
          return Userfriend.load(savedusers[0]._id)
          .then(function(d) {
            d = JSON.parse(JSON.stringify(d));
            d.should.have.length(0)
          });
        }).then(function() {
          return Userfriend.add(savedusers[0]._id, savedusers[1]._id)
        }).then(function() {
          return Userfriend.load(savedusers[0]._id)
          .then(function(d) {
            d = JSON.parse(JSON.stringify(d));
            d.should.have.length(1)
            d[0].status.should.equal(1)
          }); 
        }).then(function() {
          return Userfriend.load(savedusers[1]._id)
          .then(function(d) {
            d = JSON.parse(JSON.stringify(d));
            d.should.have.length(1)
            d[0].status.should.equal(2)
          }); 
        }).then(function() {
          return Userfriend.add(savedusers[1]._id, savedusers[0]._id)
        }).then(function() {
          return Userfriend.load(savedusers[0]._id)
          .then(function(d) {
            d = JSON.parse(JSON.stringify(d));
            d.should.have.length(1)
            d[0].status.should.equal(3)
          }); 
        }).then(function() {
          return Userfriend.load(savedusers[1]._id)
          .then(function(d) {
            d = JSON.parse(JSON.stringify(d));
            d.should.have.length(1)
            d[0].status.should.equal(3)
          }); 
        }).then(function() {
          return Userfriend.delete(savedusers[0]._id, savedusers[1]._id)
        }).then(function() {
          return Userfriend.load(savedusers[0]._id)
          .then(function(d) {
            d = JSON.parse(JSON.stringify(d));
            d.should.have.length(0)
          });
        }).then(function() {
          return Userfriend.load(savedusers[1]._id)
          .then(function(d) {
            d = JSON.parse(JSON.stringify(d));
            d.should.have.length(0)
          });
        }).then(function() {
          done();
        }).catch(function(err) {
          should.not.exist(err);
          done();
        });
      });
  
      it("should show an error when you try to add yourself as a friend (add)", function(done) {
        return Promise.resolve()
        .then(function() {
          return Userfriend.add(savedusers[0]._id, savedusers[0]._id)
        }).catch(function(err) {
          should.exist(err);
          done();
        });
      }); 

      it("should show an error when try to add friend with wrong userids (add)", function(done) {
        return Promise.resolve()
        .then(function() {
          return Userfriend.add(savedusers[0]._id, savedusers[1]._id.slice(0, 12))
        }).catch(function(err) {
          should.exist(err);
          done();
        });
      });

      it("should show an error when try to add friend with wrong target ids (add)", function(done) {
        return Promise.resolve()
        .then(function() {
          return Userfriend.add(savedusers[0]._id.slice(0, 12), savedusers[1]._id)
        }).catch(function(err) {
          should.exist(err);
          done();
        });
      });

      it("should show an error when try to delete friend with wrong userids (delete)", function(done) {
        return Promise.resolve()
        .then(function() {
          return Userfriend.delete(savedusers[0]._id, savedusers[1]._id.slice(0, 12))
        }).catch(function(err) {
          should.exist(err);
          done();
        });
      });

      it("should show an error when try to delete friend with wrong target ids (delete)", function(done) {
        return Promise.resolve()
        .then(function() {
          return Userfriend.delete(savedusers[0]._id.slice(0, 12), savedusers[1]._id)
        }).catch(function(err) {
          should.exist(err);
          done();
        });
      });
    });

    afterEach(function(done) {
      return Promise.resolve()
      .then(function() {
        return Promise.cast(Userfriend.remove().exec());
      }).then(function() {
        return Promise.cast(User.remove().exec());
      }).then(function() {
        users = [];
        savedusers = [];
        done();
      }).catch(function(err) {
        should.not.exist(err);
        done();
      });
    });
  });
});
