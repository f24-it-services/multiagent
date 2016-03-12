'use strict';

const Request = require('./request');
const SimpleFailover = require('./simple-failover');

const ConsulFailover = function (options) {
  if (!options.serviceName) throw new Error('Please provide a service name');
  if (!options.discoveryServers || !options.discoveryServers.length) throw new Error('Please provide at least one discovery server URL');

  this.serviceName = options.serviceName;
  this.serviceProtocol = options.serviceProtocol || 'http';
  this.serviceStrategy = options.serviceStrategy || 'sequentially';
  this.discoveryServers = options.discoveryServers;
  this.discoveryStrategy = options.discoveryStrategy || 'simultaneously';
  this.refreshAfter = options.refreshAfter || 60000;
  this.discoveryTimeout = options.discoveryTimeout || 10000;
  if (options.shouldFailOver) this.shouldFailOver = options.shouldFailOver;
  if (options.createConsulRequestPath) this.createConsulRequestPath = options.createConsulRequestPath;
  if (options.createServerListFromConsulResponse) this.createServerListFromConsulResponse = options.createServerListFromConsulResponse;

  this._lastDiscovery = 0;
  this._isDiscovering = false;
  this._serverList = [];
  this._callbacks = [];

  // Set properties to satisfy Failover interface:
  this.strategy = this.serviceStrategy;

  // Prepare discovery:
  this._discoveryRequestPath = this.createConsulRequestPath(this.serviceName);
  this._discoveryFailOver = new SimpleFailover({
    servers: this.discoveryServers,
    strategy: this.discoveryStrategy
  });
};

ConsulFailover.prototype.resolveServers = function (cb) {
  const stillValid = this._serverList.length && (Date.now() - this._lastDiscovery < this.refreshAfter);
  if (stillValid) return cb && cb(null, this._serverList);
  if (cb) this._callbacks.push(cb);
  if (this._isDiscovering) return;

  this._isDiscovering = true;

  const req = new Request('GET', this._discoveryRequestPath, this._discoveryFailOver);
  req.timeout(this.discoveryTimeout);
  req.end((err, res) => {
    const servers = !err ? this.createServerListFromConsulResponse(res.body, this.serviceProtocol) : [];
    const error = err || (!servers.length ? new Error(`No endpoints found for service '${this.serviceName}'`) : null);
    const callbacks = this._callbacks;
    this._lastDiscovery = Date.now();
    this._isDiscovering = false;
    this._serverList = servers;
    this._callbacks = [];
    callbacks.forEach(fn => {
      try {
        fn(error, servers);
      } catch (e) {
        (console.error || console.log)(e);
      }
    });
  });
};

ConsulFailover.prototype.shouldFailOver = function (err, res) {
  return err || res.status >= 400;
};

ConsulFailover.prototype.createConsulRequestPath = function (serviceName) {
  return `/v1/health/service/${encodeURIComponent(serviceName)}?passing=true`;
};

ConsulFailover.prototype.createServerListFromConsulResponse = function (body, serviceProtocol) {
  return body.map(x => `${serviceProtocol}://${x.Service.Address}:${x.Service.Port}`);
};

module.exports = ConsulFailover;
