
var dualapi = require('./index');

var domain = dualapi();

domain.mount(['journal', ':name'], function (ctxt) {
    console.log(ctxt.from.join('/') + ' published to the journal of ' + ctxt.params.name + ' : ', ctxt.body);
});

domain.send(['journal', 'bioinformatics'], ['scientist'], 'The Human Genome');

domain.mount(['laboratory', 'supercomputer'], function (ctxt) {
    ctxt.reply('Super Computed: ' + ctxt.body);
});

domain.mount(['scientist'], function (ctxt) {
    if (ctxt.from.join('/') === 'laboratory/supercomputer') {
        domain.send(['journal', 'computation'], ['scientist'], ctxt.body);
    }
    else {
        domain.send(['laboratory', 'supercomputer'], ['scientist'], ctxt.body);
    }
});

domain.send(['scientist'], [], 'sequence alignment');

domain.get(['laboratory', 'supercomputer'], 'test data')
.then(function (ctxt) {
    console.log('super computer result: ', ctxt.body);
});

var io = require('./examples/mock-io');  //  pretends to be socket.io

// on the server side
io.listen().on('connect', function (socket) {
    domain.open(['alice'], socket);
    domain.send(['alice', 'ready']);
});

// on the client side

var aliceDomain = dualapi();
var socket = io.connect();
aliceDomain.open(['server'], socket);

aliceDomain.mount(['ready'], function () {
    aliceDomain.send(['server', 'scientist'], ['tip'], 'Alice data');
});

aliceDomain.mount(['supercomputer'], function (ctxt) {
    ctxt.forward(['server', 'laboratory', 'supercomputer']);
});

aliceDomain.mount(['ready'], function () {
    aliceDomain.get(['supercomputer'], 'alice super computer data')
    .then(function (ctxt) {
        console.log('client side super computer: ', ctxt.body);
    });
});






