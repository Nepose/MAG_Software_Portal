/**
 * STB Proxy device (server) side
 * @constructor
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */
function ProxyServer () {

	/**
	 * proxy instance configuration
	 * @namespace
	 */
	var config = {
		/** node.js server address */
		host : '127.0.0.1',

		/** websocket server port */
		port : 8900,

		/** session name */
		name : 'anonymous'
	};

	/**
	 * Prepares the connection
	 * @param {Object} options set of initialization parameters (host, port, name)
	 */
	this.init = function ( options ) {
		// validate and iterate input
		if ( options ) for ( var name in options ) {
			// rewrite defaults
			if ( options.hasOwnProperty(name) ) config[name] = options[name];
		}

		// establish the connection
		config.socket = new WebSocket('ws://' + config.host + ':' + config.port + '/' + config.name);

		// event hook
		config.socket.onopen = function(){
			console.log('socket.onopen', config.name);
		};

		// event hook
		config.socket.onclose = function(){
			console.log('socket.onclose', config.name);
		};

		// message from a desktop browser
		config.socket.onmessage = function ( message ) {
			console.log('socket.onmessage', config.name);
			// prepare
			var result = {time:+new Date()},
				request;
			// proceed the message
			try {
				request = JSON.parse(message.data || false);
				// valid incoming request
				if ( request && ['call', 'eval'].indexOf(request.type) !== -1 ) {
					// exec types
					if ( request.type === 'call' ) {
						result.data = eval(request.method).apply(window, request.params);
					} else if ( request.type === 'eval' ) {
						result.data = eval(request.code);
					}
				} else {
					result.error = 'invalid incoming request';
				}
			} catch ( e ) {
				console.log(e);
				result.error = e;
			}
			// time taken
			result.time = +new Date() - result.time;
			// wrap and send back
			config.socket.send(JSON.stringify(result));
		}
	};

	/**
	 * Finish the connection
	 */
	this.close = function () {
		config.socket.close();
	}
}
