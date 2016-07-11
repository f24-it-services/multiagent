'use strict';

const Request = require('./request');

const Client = function (failover) {
  this._failover = failover;
  this.resolveServers = new Promise((resolve, reject) => failover.resolveServers((error, servers) => {
    if (error) {
      reject(error);
    } else {
      resolve(servers);
    }
  }));
};

Client.prototype.request = function (method, path) {
  return new Request(method, path, this._failover);
};

['head', 'get', 'post', 'put'].forEach(key => {
  Client.prototype[key] = function (path, data, fn) {
    const req = this.request(key.toUpperCase(), path);
    if (typeof data === 'function') fn = data, data = null;
    if (data) req.send(data);
    if (fn) req.end(fn);
    return req;
  };
});

['delete', 'del'].forEach(key => {
  Client.prototype[key] = function (path, fn) {
    const req = this.request('DELETE', path);
    if (fn) req.end(fn);
    return req;
  };
});

module.exports = Client;
