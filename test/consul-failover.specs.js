'use strict';

const expect = require('expect.js');
const helpers = require('./test-helpers');

describe('ConsulFailover', function () {
  let fixture;

  beforeEach(helpers.reset);

  describe('when all discovery servers work fine', function () {
    beforeEach(function (done) {
      fixture = helpers.createConsulFailoverFixture('all-healthy', 'all-healthy', 500, 0, done);
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
    it('should have called the first discovery server', function () {
      expect(fixture.serviceCalls[fixture.cluster[0].id].length).to.be(1);
    });
    it('should have called the second discovery server', function () {
      expect(fixture.serviceCalls[fixture.cluster[1].id].length).to.be(1);
    });
    it('should have called the third discovery server', function () {
      expect(fixture.serviceCalls[fixture.cluster[2].id].length).to.be(1);
    });
    it('should call the callback function exactly once', function (done) {
      fixture = helpers.createConsulFailoverFixture('all-healthy', 'all-healthy', 500, 500, () => {
        expect(fixture.callbackCalls).to.be(1);
        done();
      });
    });
  });

  describe('when first discovery server fails', function () {
    beforeEach(function (done) {
      fixture = helpers.createConsulFailoverFixture('first-one-failing', 'all-healthy', 500, 0, done);
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
    it('should have called the first discovery server', function () {
      expect(fixture.serviceCalls[fixture.cluster[0].id].length).to.be(1);
    });
    it('should have called the second discovery server', function () {
      expect(fixture.serviceCalls[fixture.cluster[1].id].length).to.be(1);
    });
    it('should have called the third discovery server', function () {
      expect(fixture.serviceCalls[fixture.cluster[2].id].length).to.be(1);
    });
    it('should call the callback function exactly once', function (done) {
      fixture = helpers.createConsulFailoverFixture('first-one-failing', 'all-healthy', 500, 500, () => {
        expect(fixture.callbackCalls).to.be(1);
        done();
      });
    });
  });

  describe('when first discovery server fails and second one times out', function () {
    beforeEach(function (done) {
      fixture = helpers.createConsulFailoverFixture('first-one-failing-second-one-times-out', 'all-healthy', 500, 0, done);
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
    it('should have called the first discovery server', function () {
      expect(fixture.serviceCalls[fixture.cluster[0].id].length).to.be(1);
    });
    it('should have called the second discovery server', function () {
      expect(fixture.serviceCalls[fixture.cluster[1].id].length).to.be(1);
    });
    it('should have called the third discovery server', function () {
      expect(fixture.serviceCalls[fixture.cluster[2].id].length).to.be(1);
    });
    it('should call the callback function exactly once', function (done) {
      fixture = helpers.createConsulFailoverFixture('first-one-failing-second-one-times-out', 'all-healthy', 500, 500, () => {
        expect(fixture.callbackCalls).to.be(1);
        done();
      });
    });
  });

  describe('when all discovery servers are very lame but do not time out', function () {
    beforeEach(function (done) {
      fixture = helpers.createConsulFailoverFixture('very-lame', 'all-healthy', 500, 0, done);
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
    it('should have called the first discovery server', function () {
      expect(fixture.serviceCalls[fixture.cluster[0].id].length).to.be(1);
    });
    it('should have called the second discovery server', function () {
      expect(fixture.serviceCalls[fixture.cluster[1].id].length).to.be(1);
    });
    it('should have called the third discovery server', function () {
      expect(fixture.serviceCalls[fixture.cluster[2].id].length).to.be(1);
    });
    it('should call the callback function exactly once', function (done) {
      fixture = helpers.createConsulFailoverFixture('very-lame', 'all-healthy', 500, 500, () => {
        expect(fixture.callbackCalls).to.be(1);
        done();
      });
    });
  });

  describe('when all discovery servers time out', function () {
    beforeEach(function (done) {
      fixture = helpers.createConsulFailoverFixture('all-time-out', 'all-healthy', 500, 0, done);
    });
    it('should fail', function () {
      expect(fixture.error).to.be.ok();
    });
    it('should return an array', function () {
      expect(fixture.serviceAddresses).to.be.an(Array);
    });
    it('should be empty', function () {
      expect(fixture.serviceAddresses).to.be.empty();
    });
    it('should have called the first discovery server', function () {
      expect(fixture.serviceCalls[fixture.cluster[0].id].length).to.be(1);
    });
    it('should have called the second discovery server', function () {
      expect(fixture.serviceCalls[fixture.cluster[1].id].length).to.be(1);
    });
    it('should have called the third discovery server', function () {
      expect(fixture.serviceCalls[fixture.cluster[2].id].length).to.be(1);
    });
    it('should call the callback function exactly once', function (done) {
      fixture = helpers.createConsulFailoverFixture('all-time-out', 'all-healthy', 500, 500, () => {
        expect(fixture.callbackCalls).to.be(1);
        done();
      });
    });
  });

  describe('when discovery servers return empty server list', function () {
    beforeEach(function (done) {
      fixture = helpers.createConsulFailoverFixture('all-healthy', 'no-endpoint', 500, 0, done);
    });
    it('should fail', function () {
      expect(fixture.error).to.be.ok();
    });
    it('should return an array', function () {
      expect(fixture.serviceAddresses).to.be.an(Array);
    });
    it('should be empty', function () {
      expect(fixture.serviceAddresses).to.be.empty();
    });
    it('should return the expected error', function () {
      expect(fixture.error.message).to.be(`No endpoints found for service 'no-endpoint'`);
    });
    it('should call the callback function exactly once', function (done) {
      fixture = helpers.createConsulFailoverFixture('all-healthy', 'no-endpoint', 500, 500, () => {
        expect(fixture.callbackCalls).to.be(1);
        done();
      });
    });
  });

});
