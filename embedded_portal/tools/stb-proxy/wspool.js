/**
 * WebSocket pool
 * wraps all the work with ws instances
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

// named WebSocket list
var pool = {};

// exports the wrapper object
module.exports = {

	/**
	 * New WebSocket creation
	 * @param {string} name unique identifier for session
	 * @param {Object} socket websocket resource
	 * @return {boolean} true if was deleted successfully
	 */
	add : function ( name, socket ) {
		var self = this;
		// check input
		if ( name && socket ) {
			console.log('ws\tINIT\t[%s]\tconnection', name);

			// main data structure
			pool[name] = {
				socket : socket,
				time   : Math.round(+new Date()/1000),
				count  : 0,
				active : true
			};

			// disable link on close
			pool[name].socket.on('close', function() {
				self.remove(name);
			});

			// await for an answer
			pool[name].socket.on('message', function(message) {
				// has link to talk back
				if ( pool[name].response ) {
					console.log('ws\tGET\t[%s]\tmessage\t%s', name, message);
					pool[name].response.end(message);
				}
			});
			return true;
		}
		// failure
		console.log('ws\tINIT\t[%s]\tfail to connect (wrong name or link)', name);
		return false;
	},

	/**
	 * Clear resources on WebSocket deletion
	 * @param {string} name session name
	 * @return {boolean} true if was deleted successfully
	 */
	remove : function ( name ) {
		// valid connection
		if ( name in pool ) {
			console.log('ws\tEXIT\t[%s]\tclose', name);
			return delete pool[name];
		}
		// failure
		console.log('ws\tDEL\t[%s]\tfail to remove (invalid connection)', name);
		return false;
	},

	/**
	 * Detailed information of the named WebSocket instance
	 * @param {string} name session name
	 * @return {{active:Boolean, count:Number}|{active:Boolean}}
	 */
	info : function ( name ) {
		// valid connection
		if ( name in pool ) {
			return {
				active : pool[name].active,
				count  : pool[name].count
			};
		}
		// failure
		return {active:false};
	},

	/**
	 *
	 * @param {string} name session name
	 * @param {string} data post data from browser to STB server
	 * @param {ServerResponse} response link to HTTP response object to send back data
	 * @return {boolean} true if was send successfully
	 */
	send : function ( name, data, response ) {
		// valid connection
		if ( name in pool && pool[name].active ) {
			console.log('ws\tSEND\t[%s]\tmessage\t%s', name, data);
			// store link to talk back when ready
			pool[name].response = response;
			// actual post
			pool[name].socket.send(data);
			pool[name].count++;
			return true;
		}
		// failure
		console.log('ws\tSEND\t[%s]\tfail to send (invalid connection)', name);
		return false;
	}

};
