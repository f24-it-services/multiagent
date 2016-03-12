'use strict';

const express = require('express');
const cors    = require('cors');
const servers = require('./test-servers.json');

const controller = servers.controller;
const consuls = servers.consuls;
const services = servers.services;

const objectValues = obj => Object.keys(obj).map(key => obj[key]);

let currentServers = [];

module.exports.start = function () {
  let promises = [];
  promises.push(startController(controller))
  promises = promises.concat(Object.keys(consuls).reduce(function (items, groupKey) {
    const svcGroup = consuls[groupKey];
    const servicesInGroup = Object.keys(svcGroup).map(svcKey => startConsulServer(groupKey, svcGroup[svcKey]));
    return items.concat(servicesInGroup);
  }, []));
  promises = promises.concat(Object.keys(services).reduce(function (items, groupKey) {
    const svcGroup = services[groupKey];
    const servicesInGroup = Object.keys(svcGroup).map(svcKey => startService(groupKey, svcGroup[svcKey]));
    return items.concat(servicesInGroup);
  }, []));
  return Promise.all(promises).then(srvrs => currentServers = srvrs);
};

module.exports.stop = function () {
  const promises = currentServers.map(app => stopServer(app));
  return Promise.all(promises).then(() => currentServers = []);
};

function startController(svc) {
  return new Promise(function (resolve) {
    const app = express();
    app.use(cors());
    app.get('/reset', function (req, res) {
      objectValues(consuls)
        .concat(objectValues(services))
        .reduce((infos, groups) => infos.concat(groups), [])
        .forEach(info => info.calls = []);
      res.end();
    });
    app.get('/calls', function (req, res) {
      if (!req.query.id) {
        const all = objectValues(consuls)
          .concat(objectValues(services))
          .reduce((infos, groups) => infos.concat(groups), [])
          .reduce((obj, info) => { obj[info.id] = info.calls; return obj; }, {});
        res.send(all);
      } else {
        const svc = objectValues(consuls)
          .concat(objectValues(services))
          .reduce((infos, groups) => infos.concat(groups), [])
          .find(info => info.id === req.query.id);
        if (svc) {
          res.send(svc.calls);
        } else {
          res.status(404).end();
        }
      }
    })
    const server = app.listen(svc.port, svc.ip, function () {
      console.log(`Controller listening on ${svc.ip}:${svc.port} ...`);
      resolve(server);
    });
  });
}

function startConsulServer(name, svc) {
  return new Promise(function (resolve) {
    svc.calls = [];
    const app = express();
    app.use(cors());
    app.get('/v1/health/service/:serviceName', function (req, res) {
      svc.calls.push({ originalUrl: req.originalUrl, headers: req.headers });
      setTimeout(function () {
        if (svc.status !== 200) {
          res.status(svc.status).end();
        } else {
          res.send(createConsulResponse(req.params.serviceName));
        }
      }, svc.delay);
    });
    const server = app.listen(svc.port, svc.ip, function () {
      console.log(`Consul server '${name}' listening on ${svc.ip}:${svc.port} ...`);
      resolve(server);
    });
  });
}

function startService(name, svc) {
  return new Promise(function (resolve) {
    svc.calls = [];
    const app = express();
    app.use(cors());
    app.get(/.*/, function (req, res) {
      svc.calls.push({ originalUrl: req.originalUrl, headers: req.headers });
      setTimeout(function () {
        if (svc.status !== 200) {
          res.status(svc.status).end();
        } else {
          res.send({ name: name, ip: svc.ip, port: svc.port });
        }
      }, svc.delay);
    });
    const server = app.listen(svc.port, svc.ip, function () {
      console.log(`Service '${name}' listening on ${svc.ip}:${svc.port} ...`);
      resolve(server);
    });
  });
}

function stopServer(server) {
  return new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
}

function createConsulResponse(serviceName) {
  return (services[serviceName] || []).map(function (svc) {
    return {
      Node: {},
      Service: {
        Address: svc.ip,
        Port: svc.port
      },
      Health: {}
    };
  });
}
