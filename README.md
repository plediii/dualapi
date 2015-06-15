# DualAPI [![Build Status](http://jenkins.plediii.net:8080/buildStatus/icon?job=dualapi master)](http://jenkins.plediii.net:8080/job/dualapi%20master/)

A simple, lightweight, distributed application framework inspired by restful HTTP architectures.

## Constructing domains

DualAPI is centered around hosts mounted within domains.
Communication within a domain is unrestricted, but cross domain
communication must be performed by hosts.

The dualapi module is the constructor for domains:
```javascript
var dualapi = require('dualapi');

var domain = dualapi();
```

## Mounting a host

Hosts are functions which accept a DualAPI message context.  Hosts are
mounted hierarchically at url like addresses represented by arrays.
```javascript
domain.mount(['journal', ':name'], function (ctxt) {
    console.log(ctxt.from.join('/') + ' published to the journal of ' + ctxt.params.name + ' : ', ctxt.body);
});
```

## Sending messages

Messages can be sent to hosts via the  `domain.send(to, from, body)` command.
```javascript
domain.send(['journal', 'bioinformatics'], ['scientist'], 'The Human Genome');
```

Sending the above message results in the output:
```shell
scientist published to the journal of bioinformatics :  The Human Genome
```

## Replying to messages

Hosts naturally can communicate with one another.  DualAPI message
context has convenience functions to facilitate this
intercommunication.  

For instance the reply command inverts the `to` and `from` addresses,
and sends a new `body`.  The following host would reply to all senders
by prepending a string to their body:
```javascript
domain.mount(['laboratory', 'supercomputer'], function (ctxt) {
    ctxt.reply('Super Computed: ' + ctxt.body);
});
```

Hosts may change their behavior based on the parameters associated
with the message.  The following host will forward all messages to the
`supercomputer`, unless the message is from the `supercompuer`, in
which case the message is sent to be published. 
```javascript
domain.mount(['scientist'], function (ctxt) {
    if (ctxt.from.join('/') === 'laboratory/supercomputer') {
        domain.send(['journal', 'computation'], ['scientist'], ctxt.body);
    }
    else {
        domain.send(['laboratory', 'supercomputer'], ['scientist'], ctxt.body);
    }
});
```

Messages sent to the scientist,
```javascript
domain.send(['scientist'], ['gradstudent'], 'sequence alignment');
```
would result in output such as
```shell
scientist published to the journal of computation :  Super Computed: sequence alignment
```


## Sending for reply only

 Note that in order to receive a reply, there must be a host mounted
at the `from` address.  The `'gradstudent'` above would never be able
to receive a message.

The `domain.get` construct facilitiates sending messages for the
purpose of receiving a reply by constructing an anonymous reply to
address, and returning a promise for the response host.

```javascript
domain.get(['laboratory', 'supercomputer'], 'test data')
.then(function (ctxt) {
    console.log('super computer result: ', ctxt.body);
});
```

Producing the output:
```shell
super computer result:  Super Computed: test data
```

## Networked Hosts

DualAPI domains may be connected across networks.  For instance via
websockets.  

### Server side

Assuming the availability of `socket.io`, we could add a socket
listener expecting a connection from alice:
```javascript
io.listen().on('connect', function (socket) {
    domain.open(['alice'], socket);
    domain.send(['alice', 'ready']);
});
```

Upon any socket connection, the server would then transfer messages to
`'alice'` to the socket, and translate messages coming over the socket
to having a `from` address of `alice`.  

Immediately after connecting the socket to the domain, a message will
be sent to `ready` on the client domain.

### Client side

Then on the client side, Alice may construct her own domain, and use
`socket.io` to connect to the server.

```javascript
var aliceDomain = dualapi();
var socket = io.connect();
aliceDomain.open(['server'], socket);
```

The server is set up to send a message to `ready` on successful
connection.  Alice prepares to send a message to the `scientist` on
the server above, immediately upon receipt.

```javascript
aliceDomain.mount(['ready'], function () {
    aliceDomain.send(['server', 'scientist'], ['tip'], 'Alice data');
});
```

On the server side then, we would see
```shell
scientist published to the journal of computation :  Super Computed: Alice data
```

Alice can create an alias for the server side `supercomputer`, by
creating a host forwarding all such messages to the server.

```javascript
aliceDomain.mount(['supercomputer'], function (ctxt) {
    ctxt.forward(['server', 'laboratory', 'supercomputer']);
});
```

When connected, Alice could then interact with her `supercomputer`
alias the same way she would on the server:
```javascript
aliceDomain.mount(['ready'], function () {
    aliceDomain.get(['supercomputer'], 'alice super computer data')
    .then(function (ctxt) {
        console.log('client side super computer: ', ctxt.body);
    });
});
```

Resulting in output on the client side:
```shell
client side super computer:  Super Computed: alice super computer data
```











