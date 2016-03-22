'use strict';

const SimpleFailover = function (options) {
  if (!options.servers || !options.servers.length) throw new Error('Please provide a list of servers');

  this.servers = options.servers;
  this.strategy = options.strategy || 'sequentially';
  if (options.shouldFailover) this.shouldFailover = options.shouldFailover;
};

SimpleFailover.prototype.resolveServers = function (cb) {
  setTimeout(() => cb(null, this.servers), 0);
};

SimpleFailover.prototype.shouldFailover = function (err, res) {
  return err || res.status >= 400;
};

module.exports = SimpleFailover;
