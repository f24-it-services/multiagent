'use strict';

const expect = require('expect.js');
const Client = require('../src/client');

describe('Client', function () {

  describe('resolveServers', function () {
    const failover = {
      resolveServers: cb => setTimeout(() => cb(null, ['http://theserver.com']), 0)
    };

    describe('when called without configuring a failover strategy', function () {
      it('should throw an error', function () {
        expect(() => new Client().resolveServers()).to.throwError();
      });
    });

    describe('when called with a callback function', function () {
      let callbackError;
      let callbackServers;
      let promise;
      beforeEach(function (done) {
        promise = new Client(failover).resolveServers((error, servers) => {
          callbackError = error;
          callbackServers = servers;
          done();
        });
      });
      it('should not fail', function () {
        expect(callbackError).to.be(null);
      });
      it('should provide the correct result in the callback', function () {
        expect(callbackServers).to.eql(['http://theserver.com']);
      });
      it('should not return a promise', function () {
        expect(promise).to.not.have.key('then');
      });
    });

    describe('when called without a callback function', function () {
      let rejection;
      let resolution;
      beforeEach(function () {
        return new Client(failover).resolveServers().then(
          servers => { resolution = servers; },
          error => { rejection = error; }
        );
      });
      it('should not fail', function () {
        expect(rejection).to.be(undefined);
      });
      it('should provide the correct result in the callback', function () {
        expect(resolution).to.eql(['http://theserver.com']);
      });
    });

  });

});
