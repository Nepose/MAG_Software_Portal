'use strict';

/* jshint unused:false */

/**
 * Cut/copy files/links system storage singleton
 * manages buffer items in two modes (cut/copy)
 * @author Stanislav Kalashnik <sk@infomir.eu>
 * @type {globalBuffer}
 */
var globalBuffer = (function () {
	// private vars
	var data  = [];  // all items
	var mode  = 1;   // default is "copy"
	var place = {};  // place where copy was made

	// main body
	return {
		// constants
		MODE_COPY : 1, // do nothing on paste
		MODE_CUT  : 2, // remove source item on paste

		/**
		 * callback function on each item paste event
		 * @param {*} data item that was pasted successfully
		 */
		onPaste : null,
		/**
		 * push new item to the list if not exist
		 * @param {*} item buffer element
		 * @return {boolean} operation status: true - item was successfully added
		 */
		add : function ( item ) {
			if ( data.indexOf(item) === -1 ) {
				data.push(item);
				return true;
			}
			return false;
		},
		/**
		 * collects all buffer items and returns new copy of this list
		 * @return {Array}
		 */
		paste : function ( func ) {
			var self = this;
			// clone data
			data.forEach(function(item){
				// run callback after cut
				if ( func(item) && typeof self.onPaste === 'function' ) {
					self.onPaste(item);
				}
			});
			// reset everything
			this.clear();
		},
		/**
		 * setter/getter for mode inner flag
		 * @param {number} [newMode] if applied then mode will be set otherwise returns the current value
		 * @return {number} new or current mode value
		 */
		mode : function ( newMode ) {
			if ( newMode !== undefined ) {
				mode = newMode;
			}
			return mode;
		},
		/**
		 * setter/getter for place inner flag (the place where copy operation was made)
		 * @param {Object} [newPlace] if applied then place will be set otherwise returns the current value
		 * @return {Object} new or current place value
		 */
		place : function ( newPlace ) {
			if ( newPlace !== undefined ) {
				place = newPlace;
			}
			return place;
		},
		/**
		 * gets the buffer items total amount
		 * @return {number}
		 */
		size : function () {
			return data.length;
		},
		/**
		 * deletes the given item from the buffer
		 * @param {*} item buffer element to be removed
		 * @return {boolean} operation status: true - item was successfully removed
		 */
		remove : function ( item ) {
			// some input
			if ( item !== undefined ) {
				// find item index to remove
				var index = data.indexOf(item);
				// one item should be removed
				if ( index !== -1 ) {
					return data.splice(index, 1).length === 1;
				}
			}
			return false;
		},
		/**
		 * resets all data
		 */
		clear : function () {
			data  = [];
			place = {};
			this.onPaste = null;
		}
	};
})();
