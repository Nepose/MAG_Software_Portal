/**
 * HTTP static file server
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

'use strict';

var files = new (require('node-static')).Server(require('path').join(__dirname, '/..'));

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        files.serve(request, response);
    }).resume();
}).listen(8080);
