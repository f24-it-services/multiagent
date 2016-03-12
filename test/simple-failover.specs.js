'use strict';

const expect = require('expect.js');
const helpers = require('./test-helpers');

describe('SimpleFailover', function () {
  let fixture;

  beforeEach(helpers.reset);

  describe('when all servers work fine', function () {
    beforeEach(function (done) {
      fixture = helpers.createSimpleFailoverFixture('all-healthy', 0, done);
    });
    it('should not fail', function () {
      expect(fixture.error).not.to.be.ok();
    });
    it('should return an array', function () {
      expect(fixture.serviceAddresses).to.be.an(Array);
    });
    it('should not be empty', function () {
      expect(fixture.serviceAddresses).not.to.be.empty();
    });
    it('should return the expected service addresses', function () {
      expect(fixture.serviceAddresses).to.eql(['http://127.0.0.1:17000', 'http://127.0.0.1:17001', 'http://127.0.0.1:17002']);
    });
    it('should call the callback function exactly once', function (done) {
      fixture = helpers.createSimpleFailoverFixture('all-healthy', 500, () => {
        expect(fixture.callbackCalls).to.be(1);
        done();
      });
    });
  });

});
