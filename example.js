var d = require('./index')();
d.mount(['unresponsive'], function (body, ctxt) {
    // do some processing
});


d.mount(['simpledb', 'get'], function (body, ctxt) {
    ctxt.return('the processed response');
});


d.request(['simpledb', 'get'])
    .spread(function (body, options) {
        console.log(options.statusCode + ' ' + body);
    });

// prints:
// "200 the processed response"

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


var doSomeRequests = function () {

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
};

doSomeRequests();
// Running this the first time would print:
// 404 Failed to retrieve from bucket
// 201 Wrote to bucket
// 200 Second request got: an egg

doSomeRequests();
// Running a second time would print:
// 200 Request returned: an egg
// 409 Failed to write to bucket.
// 200 Second request got: an egg

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

