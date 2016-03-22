# multiagent

Simple HTTP client with failover functionality for node.js and browsers

It supports simple fallback addresses as well as dynamic service discovery using [Consul](https://www.consul.io/).

Multiagent uses [superagent](http://visionmedia.github.io/superagent/) under the covers and exposes
most of its API as well as an additional promise interface (if native promises are available).

All browsers with ECMAScript 5 support should work.

## Installation

node.js, browserify, webpack:

```sh
npm install --save multiagent
```

as a global script in the browser:

```html
<script src="node_modules/multiagent/lib/browser.min.js"></script>
```

from a CDN:

```html
<script src="https://npmcdn.com/multiagent/lib/browser.min.js"></script>
```

In case you load multiagent with a script reference into the browser,
it will create the global variable `multiagent`.

## Examples

### Simple HTTP requests

```js
const agent = require('multiagent');

// create a request:
const req = agent.request('GET', 'http://domain.com');

// or use a shorthand (there's also: 'head', 'post', 'put', 'delete'/'del')
const req = agent.get('http://domain.com');

// execute a request, providing a callback:
req.end((err, res) => console.log(err || res.body));

// or instead, use the promise interface:
const promise = req.promise();
promise.then(res => console.log(res.body), err => console.log(err));

// you can also simply just call 'then' (or 'catch') on the request:
req.then(res => console.log(res.body), err => console.log(err));
```

### HTTP client with failover

```js
const agent = require('multiagent');

// create a client:
const client = agent.client({
  servers: ['http://sub1.abc.com', 'http://sub2.abc.com', 'http://sub3.abc.com']
});

// then do stuff:
client
  .get('/endpoint') // use just the path without host!
  .timeout(500) // used per individual call!
  .end((err, res) => console.log(err || res.body));
```

### HTTP client with discovery using Consul

```js
const agent = require('multiagent');

// create a client:
const client = agent.client({
  discovery: 'consul', // only possible value at the moment, could change in the future
  discoveryServers: ['http://consul1.abc.com', 'http://consul2.abc.com', 'http://consul3.abc.com'],
  serviceName: 'my-service'
});

// then do stuff:
client
  .get('/endpoint') // use just the path without host!
  .timeout(500) // used per individual service call!
  .end((err, res) => console.log(err || res.body));
```

## Advanced client options

For the client using simple failover you can pass the following additional options:

* __strategy__: string, (sequentially|randomly|simultaneously), default: 'sequentially'
* __shouldFailover__: function, default: `(err, res) => err || res.status >= 400`

For the client using Consul you can pass the following additional options:

* __serviceProtocol__: string, (http|https), default: 'http'
* __serviceStrategy__: string, (sequentially|randomly|simultaneously), default: 'sequentially'
* __discoveryTimeout__: number, in milliseconds, default: 2000
* __discoveryStrategy__: string, (sequentially|randomly|simultaneously), default: 'simultaneously'
* __refreshAfter__: number, in milliseconds, default: 60000
* __shouldFailover__: function, default: `(err, res) => err || res.status >= 400`
* __createConsulRequestPath__: function, default: ``serviceName => `/v1/health/service/${encodeURIComponent(serviceName)}?passing=true` ``,
* __createServerListFromConsulResponse__: function, default: ``(body, serviceProtocol) => body.map(x => `${serviceProtocol}://${x.Service.Address}:${x.Service.Port}`)``

## Finetuning failover options on a per request basis

When you create a client with failover using `agent.client({ /* options */ })` you can override
the failover strategy as well as the failover criteria on a per request basis. This is sometimes useful
when e.g. in a RESTful environment a response with status code 404 (not found) is a perfectly valid
result and should not lead to any failover:

~~~js
// create a client with default options for all requests issued using this client instance:
const client = agent.client({
  servers: ['http://sub1.abc.com', 'http://sub2.abc.com', 'http://sub3.abc.com'],
  strategy: 'simultaneously',
  shouldFailover: (err, res) => err || res.status >= 400
});

// this will execute the requests sequentially and NOT failover on a 404 status response,
// thus overriding the options 'strategy' and 'shouldFailover' set as default on the client:
client
  .get('/endpoint')
  .failover({ strategy: 'sequentially' })
  .failover({ shouldFailover: (err, res) => err || (res.status >= 400 && res.status !== 404) }) 
~~~

## Supported API

The following functions from [superagent](http://visionmedia.github.io/superagent/) are supported:

### On the client

* head
* get
* post
* put
* delete
* del

Additionally:

* request
* failover

### On the request

* set
* query
* send
* type
* accept
* timeout
* auth
* redirects
* attach
* field
* withCredentials
* abort
* end

Additionally:

* promise
* then
* catch

## License

MIT
