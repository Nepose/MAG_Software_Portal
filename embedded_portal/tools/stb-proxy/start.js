/**
 * STB Proxy server node.js part
 * handles all requests between desktop browser (client) and server (stb device)
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

// globals
var WebSocketServer = require('ws').Server,
	wsPool = require('./wspool.js'),
	http   = require('http'),
	fs     = require('fs');

// connection ports
var portHttp = 8800,  // http server
	portWss  = 8900;  // websocket server
		
// files allowed to be served
var fileList = ['client.js', 'server.js'];


// WebSocket server creation
wss = new WebSocketServer({port:portWss});
wss.on('connection', function(socket) {
	// new awaiting instance of WebSocket in the pool
	wsPool.add(socket.upgradeReq.url.slice(1), socket);
});
console.log('port %d accepts WebSocket connections', portWss);


// simple http listener
http.createServer(function(request, response){
	console.log('http\t%s\t%s', request.method, request.url);
	// prepare request query
	var query = request.url.slice(1).split('/');

	switch ( request.method ) {

		// simple serve info/file requests
		case 'GET':
			// first param holds the command name
			switch ( query[0] ) {
				// serving files
				case 'file':
					// one of the allowed files
					if ( fileList.indexOf(query[1]) !== -1 ) {
						response.writeHead(200, {'Content-Type':'application/javascript; charset=utf-8'});
						response.end(fs.readFileSync(query[1]));
					}
					break;
				// get connection info
				case 'info':
					//var wsItem = wsList.get(query[1]);
					response.writeHead(200, {'Content-Type':'application/json; charset=utf-8'});
					response.end(JSON.stringify(wsPool.info(query[1])));
					break;
				// show help page
				default:
					// not valid url or root
					response.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
					response.end(fs.readFileSync('start.html'));
			}
			break;

		// security info call
		case 'OPTIONS':
			//TODO: investigate why doesn't work
			response.writeHead(200, {
				'Access-Control-Allow-Origin'      : '*',
				'Access-Control-Allow-Credentials' : 'true',
				'Access-Control-Allow-Methods'     : 'POST, GET, OPTIONS',
				'Access-Control-Allow-Headers'     : 'content-type',
				'Access-Control-Max-Age'           : 1800
			});
			response.end();
			break;

		// accept connections from desktop clients
		case 'POST':
			var post = '';
			// append all chunks
			request.on('data', function(data){ post += data; });
			// everything is ready to send to the STB
			request.on('end', function(){
				// make a call
				if ( !wsPool.send(query[0], post, response) ) {
					// no available connections so close
					response.end(JSON.stringify({error:'no connections'}));
				}
			});
			break;

		default:
			response.end('wrong request!');
	}
}).listen(portHttp);
console.log('port %d accepts HTTP connections\n', portHttp);
