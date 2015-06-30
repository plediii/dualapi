# DualAPI [![Build Status](http://jenkins.plediii.net:8080/buildStatus/icon?job=dualapi master)](http://jenkins.plediii.net:8080/job/dualapi%20master/)

A lightweight and extensible framework for distributed isomorphic javascript
applications.  DualAPI extends
[dual-protocol](https://github.com/plediii/dual-protocol), adding
convenience functions and default behaviors for common messaging
patterns.

For a simple example distributed example, see the [dual-engine.io
example](https://github.com/plediii/dual-engine.io/tree/master/example).

## Constructing domains

The `dualapi` module is the constructor for `dualapi` domains.

```javascript
  var d = require('dualapi')();
```

The most common use case for `dualapi` domains is to provide
a listener function for processing `dual-protocol` messages.  Hosts
are attached to the domain by using the 
[dual-protocol `mount` method](https://github.com/plediii/dual-protocol#constructing-dual-protocol-domains):

```javascript
  d.mount(['unresponsive'], function (body, ctxt) {
    // do some processing
  });
```

## Request and Return

Often, a `dualapi` host will emit a response after processing 
input.  `dualapi` provides a convienent extension to `dual-protocol`
by providing the [`ctxt.return`](https://github.com/plediii/dualapi/blob/master/src/return.js) method.

```javascript
  d.mount(['simpledb', 'get'], function (body, ctxt) {
    ctxt.return('the processed response');
  });
```

By default, `return` sets the returned `options.statusCode` to `200`.
Then, any method having access to a connected domain may request data
from this address.  The
[request](https://github.com/plediii/dualapi/blob/master/src/request.js)
method returns a spreadable promise which will be resolved when the
source host replies:

```javascript
  d.request(['simpledb', 'get'])
    .spread(function (body, options) {
       console.log(options.statusCode + ' ' + body);
    });

   // prints:
   // "200 the processed response"
```

A smarter database can override the response `statusCode` by providing
explicit options.

```javascript
  var db = {};
  d.mount(['smarterdb', 'set', ':key'], function (body, ctxt) {
    if (db.hasOwnProperty(ctxt.params.key)) {
       ctxt.return('Conflict', { statusCode: 409 });
    } else {
       db[ctxt.params.key] = body;
       ctxt.return('OK', { statusCode: 201 });
    }
  });

  d.mount(['smarterdb', 'get', ':key'], function (body, ctxt) {
    if (db.hasOwnProperty(ctxt.params.key)) {
       ctxt.return(db[ctxt.params.key]);
    } else {
       ctxt.return('Not Found', { statusCode: 404 });
    }
  });

```

A client can use the enhanced status codes to modify its own response:
```javascript

  d.request(['smarterdb', 'get', 'bucket'])
      .spread(function (body, options) {
         if (options.statusCode == 200) {
            console.log('' + options.statusCode + ' Request returned: ' + body);
         } else {
            console.log('' + options.statusCode + ' Failed to retrieve from bucket.');
         }
      });
      
  d.request(['smarterdb', 'set', 'bucket'], 'an egg')
      .spread(function (body, options) {
         if (options.statusCode == 201) {
            console.log('' + options.statusCode + ' Wrote to bucket');
         } else {
            console.log('' + options.statusCode + ' Failed to write to bucket.');
         }
      });

  d.request(['smarterdb', 'get', 'bucket'])
      .spread(function (body, options) {
         if (options.statusCode == 200) {
            console.log('' + options.statusCode + ' Second request got: ' + body);
         } else {
            console.log('' + options.statusCode + ' Second request failed to retrieve bucket.');
         }
      });

  // Running this the first time would print:
  // 404 Failed to retrieve from bucket
  // 201 Wrote to bucket
  // 200 Second request got: an egg

  // Running a second time would print:
  // 200 Request returned: an egg
  // 409 Failed to write to bucket.
  // 200 Second request got: an egg
```

On the other hand, if no host is listening at the requested address,
request will return with a status code of `503`.  The request may also
provide a timeout option, in which case the status code will be `504`.

```javascript
d.request(['nowhere'])
    .spread(function (body, options) {
        console.log('"nowhere" request returned status code ' + options.statusCode);
    });

// would print
// "nowhere" request returned status code 503

d.request(['unresponsive'], null, { timeout: 1 })
    .spread(function (body, options) {
        console.log('"unresponsive" request returned status code ' + options.statusCode);
    });

// would print (after 1 second delay)
// "unresponsive" request returned status code 504
```

## Forward

 To be written.

## Proxy

 To be written.

## Error

 To be written.







