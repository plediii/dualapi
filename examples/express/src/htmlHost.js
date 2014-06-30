

var dual = require('dualapi');
var xml = require('xml4node');
var socket = require('socket.io-client')();

var htmlHost = function () {
    var host = new dual.Host();
    var doc = xml.doc(xml.elt('doc'));

    host.action('put')
        .route(['site'])
        .use(function (route, msg) {
            xml.setNode(xml.docGet(doc, route), msg);
            console.log('put document: ', xml.nodeToString(doc.root));
            document.write(xml.nodeToString(doc.root));
        });

    host.doc = doc;
    return host;
};
var raster = htmlHost();
var socketHost = dual.socketHost(socket);
raster.serve(socketHost);

socket.on('connect', function(){
    socketHost.trigger('watch', ['site', 'doc']);
});
