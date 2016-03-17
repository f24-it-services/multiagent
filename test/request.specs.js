'use strict';

const expect = require('expect.js');
const helpers = require('./test-helpers');

describe('Request', function () {
  let fixture;

  beforeEach(helpers.reset);

  describe('when used as a plain HTTP client', function () {
    beforeEach(function (done) {
      fixture = helpers.createHttpRequestFixture('all-healthy', { param: 'hello' }, { accept: 'application/json' }, 0, done);
    });
    it('should call the specified URL', function () {
      expect(fixture.serviceCalls[fixture.service.id].length).to.be(1);
    });
    it('should include the specified query parameters', function () {
      expect(fixture.serviceCalls[fixture.service.id][0].originalUrl).to.be('/endpoint?param=hello');
    });
    it('should send the specified headers', function () {
      expect(fixture.serviceCalls[fixture.service.id][0].headers.accept).to.be('application/json');
    });
    it('should return the correct status code', function () {
      expect(fixture.response.status).to.be(200);
    });
    it('should return an object', function () {
      expect(fixture.response.body).to.be.an(Object);
    });
    it('should call the callback function exactly once', function (done) {
      fixture = helpers.createHttpRequestFixture('all-healthy', { param: 'hello' }, { accept: 'application/json' }, 500, () => {
        expect(fixture.callbackCalls).to.be(1);
        done();
      });
    });
  });

  describe('when used with multiple servers and random strategy', function () {
    beforeEach(function (done) {
      fixture = helpers.createMultipleRequestFixture('all-healthy', 'randomly', 0, done);
    });
    it('should have called only one server', function () {
      const serviceCalls = fixture.services.map(svc => fixture.serviceCalls[svc.id]);
      expect(serviceCalls.reduce((sum, call) => sum + call.length, 0)).to.be(1);
    });
    it('should return the correct status code', function () {
      expect(fixture.response.status).to.be(200);
    });
    it('should return an object', function () {
      expect(fixture.response.body).to.be.an(Object);
    });
    it('should call the callback function exactly once', function (done) {
      fixture = helpers.createMultipleRequestFixture('all-healthy', 'randomly', 500, () => {
        expect(fixture.callbackCalls).to.be(1);
        done();
      });
    });
  });

  describe('when all service endpoints work fine', function () {
    beforeEach(function (done) {
      fixture = helpers.createServiceRequestFixture('all-healthy', 'all-healthy', 200, 200, 0, done);
    });
    it('should not fail', function () {
      expect(fixture.error).not.to.be.ok();
    });
    it('should return the correct status code', function () {
      expect(fixture.response.status).to.be(200);
    });
    it('should return an object', function () {
      expect(fixture.response.body).to.be.an(Object);
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
    it('should have called the first service server', function () {
      expect(fixture.serviceCalls[fixture.service[0].id].length).to.be(1);
    });
    it('should not have called the second service server', function () {
      expect(fixture.serviceCalls[fixture.service[1].id].length).to.be(0);
    });
    it('should not have called the third service server', function () {
      expect(fixture.serviceCalls[fixture.service[2].id].length).to.be(0);
    });
    it('should call the callback function exactly once', function (done) {
      fixture = helpers.createServiceRequestFixture('all-healthy', 'all-healthy', 200, 200, 500, () => {
        expect(fixture.callbackCalls).to.be(1);
        done();
      });
    });
  });

  describe('when first two service endpoints fail', function () {
    beforeEach(function (done) {
      fixture = helpers.createServiceRequestFixture('all-healthy', 'two-of-three-failing', 200, 200, 0, done);
    });
    it('should not fail', function () {
      expect(fixture.error).not.to.be.ok();
    });
    it('should return the correct status code', function () {
      expect(fixture.response.status).to.be(200);
    });
    it('should return an object', function () {
      expect(fixture.response.body).to.be.an(Object);
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
    it('should have called the first service server', function () {
      expect(fixture.serviceCalls[fixture.service[0].id].length).to.be(1);
    });
    it('should have called the second service server', function () {
      expect(fixture.serviceCalls[fixture.service[1].id].length).to.be(1);
    });
    it('should have called the third service server', function () {
      expect(fixture.serviceCalls[fixture.service[2].id].length).to.be(1);
    });
    it('should call the callback function exactly once', function (done) {
      fixture = helpers.createServiceRequestFixture('all-healthy', 'two-of-three-failing', 200, 200, 500, () => {
        expect(fixture.callbackCalls).to.be(1);
        done();
      });
    });
  });

  describe('when all service endpoints fail', function () {
    beforeEach(function (done) {
      fixture = helpers.createServiceRequestFixture('all-healthy', 'all-failing', 200, 200, 0, done);
    });
    it('should fail', function () {
      expect(fixture.error).to.be.ok();
    });
    it('should return the correct status code', function () {
      expect(fixture.error.status).to.be(500);
    });
    it('should not return a response', function () {
      expect(fixture.response).not.to.be.ok();
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
    it('should have called the first service server', function () {
      expect(fixture.serviceCalls[fixture.service[0].id].length).to.be(1);
    });
    it('should have called the second service server', function () {
      expect(fixture.serviceCalls[fixture.service[1].id].length).to.be(1);
    });
    it('should have called the third service server', function () {
      expect(fixture.serviceCalls[fixture.service[2].id].length).to.be(1);
    });
    it('should call the callback function exactly once', function (done) {
      fixture = helpers.createServiceRequestFixture('all-healthy', 'all-failing', 200, 200, 500, () => {
        expect(fixture.callbackCalls).to.be(1);
        done();
      });
    });
  });

  describe('when the first service endpoint times out', function () {
    beforeEach(function (done) {
      fixture = helpers.createServiceRequestFixture('all-healthy', 'first-one-times-out', 200, 500, 0, done);
    });
    it('should not fail', function () {
      expect(fixture.error).not.to.be.ok();
    });
    it('should return the correct status code', function () {
      expect(fixture.response.status).to.be(200);
    });
    it('should return an object', function () {
      expect(fixture.response.body).to.be.an(Object);
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
    it('should have called the first service server', function () {
      expect(fixture.serviceCalls[fixture.service[0].id].length).to.be(1);
    });
    it('should have called the second service server', function () {
      expect(fixture.serviceCalls[fixture.service[1].id].length).to.be(1);
    });
    it('should not have called the third service server', function () {
      expect(fixture.serviceCalls[fixture.service[2].id].length).to.be(0);
    });
    it('should call the callback function exactly once', function (done) {
      fixture = helpers.createServiceRequestFixture('all-healthy', 'first-one-times-out', 200, 500, 500, () => {
        expect(fixture.callbackCalls).to.be(1);
        done();
      });
    });
  });

  describe('when no service endpoint is available', function () {
    beforeEach(function (done) {
      fixture = helpers.createServiceRequestFixture('all-healthy', 'no-endpoint', 200, 500, 0, done);
    });
    it('should fail', function () {
      expect(fixture.error).to.be.ok();
    });
    it('should not return a response', function () {
      expect(fixture.response).not.to.be.ok();
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
      fixture = helpers.createServiceRequestFixture('all-healthy', 'no-endpoint', 200, 500, 500, () => {
        expect(fixture.callbackCalls).to.be(1);
        done();
      });
    });
  });

});
