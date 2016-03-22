'use strict';

const arrayShuffle = require('array-shuffle');
const superagent = require('superagent');

const Request = function (method, path, failover) {
  this.method = method;
  this.path = path;
  this._failover = failover ? Object.create(failover) : null;
  this._actions = [];
  this._requests = [];
  this._called = false;
};

[
  'set',
  'query',
  'send',
  'type',
  'accept',
  'timeout',
  'auth',
  'redirects',
  'attach',
  'field',
  'withCredentials'
].forEach(key => {
  Request.prototype[key] = function () {
    this._actions.push({ key: key, params: [].slice.call(arguments) });
    return this;
  };
});

Request.prototype.abort = function () {
  this._requests.forEach(x => x.abort());
};

Request.prototype.end = function (cb) {
  if (this._called) throw new Error('end can be only called once');
  this._called = true;

  if (this._failover) {
    this._failover.resolveServers((err, addr) => {
      if (err) return cb && cb(err);
      if (!addr || ! addr.length) return cb && cb(new Error('server list is empty'));
      const urls = addr.map(server => concatPath(server, this.path));
      if (this._failover.strategy === 'simultaneously') {
        this._executeSimultaneously(urls, cb);
      } else if (this._failover.strategy === 'sequentially') {
        this._executeSequentially(urls, cb);
      } else if (this._failover.strategy === 'randomly') {
        this._executeSequentially(arrayShuffle(urls), cb);
      } else {
        return cb && cb(new Error(`Unknown strategy '${this._failover.strategy}'`));
      }
    });
  } else {
    this._executeSingle(this.path, cb);
  }

  return this;
};

Request.prototype.failover = function (options) {
  if (!options || !this._failover) return this;
  if (options.strategy) this._failover.strategy = options.strategy;
  if (options.shouldFailover) this._failover.shouldFailover = options.shouldFailover;
  return this;
};

Request.prototype.promise = function () {
  if (!Promise) throw new Error('Promises are not available in the current environment');
  this._promise = this._promise || new Promise((resolve, reject) => {
    this.end((err, res) => {
      if (typeof res !== 'undefined' && res.status >= 400) {
        const msg = `Cannot ${this.method} ${this.url} (${res.status})`;
        const error = new Error(msg);
        error.status = res.status;
        error.body = res.body;
        error.res = res;
        reject(error);
      } else if (err) {
        reject(new Error(err));
      } else {
        resolve(res);
      }
    });
  });
  return this._promise;
};

Request.prototype.then = function () {
  const p = this.promise();
  return p.then.apply(p, arguments);
};

Request.prototype.catch = function () {
  const p = this.promise();
  return p.catch.apply(p, arguments);
};

Request.prototype._executeSingle = function (url, cb) {
  const req = superagent(this.method, url);
  this._actions.forEach(x => req[x.key].apply(req, x.params));
  this._requests.push(req);
  req.end(cb);
  return req;
};

Request.prototype._executeSimultaneously = function (urls, cb) {
  let settled = false;
  let remaining = urls.length;
  urls.forEach(url => {
    const req = this._executeSingle(url, (err, res) => {
      remaining -= 1;
      if (settled) return;
      if (!this._failover.shouldFailover(err, res, this) || remaining === 0) {
        settled = true;
        if (cb) cb(err, res);
        this._requests.filter(x => x !== req).forEach(x => x.abort());
      }
    });
  });
};

Request.prototype._executeSequentially = function (urls, cb) {
  const url = urls[0];
  this._executeSingle(url, (err, res) => {
    if (!err || !this._failover.shouldFailover(err, res, this)) return cb && cb(err, res);
    if (urls.length <= 1) return cb && cb(err || new Error('No more fail over URLs to try'));
    return this._executeSequentially(urls.slice(1), cb);
  });
};

function concatPath(basePath, childPath) {
  return childPath ? `${basePath.replace(/\/+$/, '')}/${childPath.replace(/^\/+/, '')}` : basePath;
}

module.exports = Request;
