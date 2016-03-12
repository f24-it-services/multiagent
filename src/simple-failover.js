'use strict';

const SimpleFailover = function (options) {
  if (!options.servers || !options.servers.length) throw new Error('Please provide a list of servers');

  this.servers = options.servers;
  this.strategy = options.strategy || 'sequentially';
  if (options.shouldFailOver) this.shouldFailOver = options.shouldFailOver;
};

SimpleFailover.prototype.resolveServers = function (cb) {
  setTimeout(() => cb(null, this.servers), 100);
};

SimpleFailover.prototype.shouldFailOver = function (err, res) {
  return err || res.status >= 400;
};

module.exports = SimpleFailover;
