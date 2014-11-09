
var dualapi = require('./index');

var dual = dualapi();

dual.mount(['lab'], function (ctxt) {
    console.log('Received ', ctxt.body, ' at the lab');
});

dual.send(['lab'], ['me'], 'Beaker');

dual.mount(['home'], function (ctxt) {
    ctxt.forward(['lab']);
});

dual.send(['home'], ['me'], 'Bunsen');


