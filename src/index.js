'use strict';

const superagent = require('superagent');
const SimpleFailover = require('./simple-failover');
const ConsulFailover = require('./consul-failover');
const Request = require('./request');
const Client = require('./client');

module.exports = new Client();
module.exports.Request = Request;
module.exports.superagent = superagent;
module.exports.client = function (options) {
  if (!options) return new Client();
  if (!options.discovery) return new Client(new SimpleFailover(options));
  if (options.discovery === 'consul') return new Client(new ConsulFailover(options));
  throw new Error(`Unsupported discovery: '${options.discovery}'`);
};
