/**
 * STB Proxy desktop browser (client) part
 * @constructor
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */
function proxyClient () {

	/**
	 * proxy instance configuration
	 * @namespace
	 */
	var config = {
		/** node.js server address */
		host : '127.0.0.1',

		/** http server port */
		port : 8800,

		/** session name */
		name : 'anonymous',

		/** cached url for posting requests */
		urlPost : null,

		/** cached url for info collecting */
		urlInfo : null
	};

	// single ajax object for performance
	var xhr = new XMLHttpRequest();

	/**
	 * Prepares the connection
	 * @param {Object} options set of initialization parameters (host, port, name, urlPost, urlInfo)
	 */
	this.init = function ( options ) {
		// validate and iterate input
		if ( options ) for ( var name in options ) {
			// rewrite defaults
			if ( options.hasOwnProperty(name) ) config[name] = options[name];
		}
		// cache final request urls
		config.urlPost = 'http://' + config.host + ':' + config.port + '/' + config.name;
		config.urlInfo = 'http://' + config.host + ':' + config.port + '/info/' + config.name;
	};

	/**
	 * Sends a sync request to the STB device from the desktop browser
	 * @param {Object} data JSON data to send
	 * @return {*} execution result from the STB
	 */
	this.send = function ( data ) {
		// mandatory init check
		if ( !config.urlPost ) return false;
		// prepare
		var time = +new Date(),
			response;
		// make request
		xhr.open('post', config.urlPost, false);
		xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
		xhr.send(JSON.stringify(data));
		// proceed the result
		try {
			response = JSON.parse(xhr.responseText);
		} catch ( e ) {
			response = {error:e};
		}
		// detailed report
		console.groupCollapsed('%c%s\t%c%d/%d ms',
			'color:' + (response.error ? 'red' : 'green'), data.method || data.code || 'unhandled STB call',
			'color:#aaa;font-weight:normal', response.time || 0, +new Date() - time);
		console.log(data);
		console.log(response.error || response.data);
		console.groupEnd();
		// ready
		return response.data;
	};

	/**
	 * Wrapper to send a line of js code to eval on the STB device
	 * @param {string} code javascript source code to execute on the device
	 * @return {*} execution result from the STB
	 */
	this.eval = function ( code ) {
		return this.send({type:'eval', code:code});
	};

	/**
	 * Wrapper to send one function of js code with arguments to eval on the STB device
	 * @param {string} method javascript function name (like "gSTB.Debug")
	 * @param {Array} params list of the function arguments
	 * @return {*} execution result from the STB
	 */
	this.call = function ( method, params ) {
		return this.send({type:'call', method:method, params:params});
	};

	/**
	 * Gets the detailed info about the current connection
	 * @return {{active:Boolean, count:Number}|{active:Boolean}|Boolean}
	 */
	this.info = function () {
		// mandatory init check
		if ( !config.urlInfo ) return false;
		// make request
		xhr.open('get', config.urlInfo, false);
		xhr.send();
		return JSON.parse(xhr.responseText || false);
	};
}
