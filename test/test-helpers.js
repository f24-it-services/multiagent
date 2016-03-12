'use strict';

const servers = require('./test-servers.json');
const agent = require('../src');
const Request = require('../src/request');
const SimpleFailover = require('../src/simple-failover');
const ConsulFailover = require('../src/consul-failover');

const controllerUrl = `http://${servers.controller.ip}:${servers.controller.port}`;

module.exports.reset = function () {
  return agent
    .get(`${controllerUrl}/reset`)
    .catch(console.error.bind(console));
};

const getServiceCalls = function () {
  return agent
    .get(`${controllerUrl}/calls`)
    .then(x => x.body, console.error.bind(console));
}

const countCallbackCalls = function (fn, waitMs, done) {
  let calls = 0;
  return function () {
    calls += 1;
    if (calls > 1) return;
    fn.apply(null, arguments);
    setTimeout(() => done(calls), waitMs || 0);
  };
};

module.exports.createSimpleFailoverFixture = function (serviceName, countCallbacksMs, done) {
  const fixture = {};
  fixture.service = servers.services[serviceName];
  fixture.failover = new SimpleFailover({
    servers: fixture.service.map(x => `http://${x.ip}:${x.port}`)
  });
  fixture.failover.resolveServers(countCallbackCalls((err, addr) => {
    fixture.error = err;
    fixture.serviceAddresses = addr;
  }, countCallbacksMs, callbackCalls => {
    fixture.callbackCalls = callbackCalls;
    getServiceCalls().then(serviceCalls => {
      fixture.serviceCalls = serviceCalls;
      done();
    }, done);
  }));
  return fixture;
};

module.exports.createConsulFailoverFixture = function (clusterName, serviceName, discoveryTimeout, countCallbacksMs, done) {
  const fixture = {};
  fixture.cluster = servers.consuls[clusterName];
  fixture.service = servers.services[serviceName];
  fixture.failover = new ConsulFailover({
    serviceName: serviceName,
    discoveryServers: fixture.cluster.map(x => `http://${x.ip}:${x.port}`),
    discoveryTimeout: discoveryTimeout
  });
  fixture.failover.resolveServers(countCallbackCalls((err, addr) => {
    fixture.error = err;
    fixture.serviceAddresses = addr;
  }, countCallbacksMs, callbackCalls => {
    fixture.callbackCalls = callbackCalls;
    getServiceCalls().then(serviceCalls => {
      fixture.serviceCalls = serviceCalls;
      done();
    }, done);
  }));
  return fixture;
};

module.exports.createServiceRequestFixture = function (clusterName, serviceName, discoveryTimeout, serviceTimeout, countCallbacksMs, done) {
  const fixture = {};
  fixture.cluster = servers.consuls[clusterName];
  fixture.service = servers.services[serviceName];
  fixture.failover = new ConsulFailover({
    serviceName: serviceName,
    discoveryServers: fixture.cluster.map(x => `http://${x.ip}:${x.port}`),
    discoveryTimeout: discoveryTimeout
  });
  fixture.request = new Request('GET', `http://${fixture.service.ip}:${fixture.service.port}/endpoint`, fixture.failover);
  fixture.request.timeout(serviceTimeout);
  fixture.request.end(countCallbackCalls((err, res) => {
    fixture.error = err;
    fixture.response = res;
  }, countCallbacksMs, callbackCalls => {
    fixture.callbackCalls = callbackCalls;
    getServiceCalls().then(serviceCalls => {
      fixture.serviceCalls = serviceCalls;
      done();
    }, done);
  }));
  return fixture;
};

module.exports.createHttpRequestFixture = function (serviceName, query, headers, countCallbacksMs, done) {
  const fixture = {};
  fixture.service = servers.services[serviceName][0];
  fixture.request = new Request('GET', `http://${fixture.service.ip}:${fixture.service.port}/endpoint`);
  if (query) fixture.request.query(query);
  if (headers) Object.keys(headers).forEach(key => fixture.request.set(key, headers[key]));
  fixture.request.end(countCallbackCalls((err, res) => {
    fixture.error = err;
    fixture.response = res;
  }, countCallbacksMs, callbackCalls => {
    fixture.callbackCalls = callbackCalls;
    getServiceCalls().then(serviceCalls => {
      fixture.serviceCalls = serviceCalls;
      done();
    }, done);
  }));
  return fixture;
};
