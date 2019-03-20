'use strict';

/**
 * PO files manipulation (gettext format)
 * @namespace
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */
var gettext = (function(){
	// declarations
	var module = {};
	var data   = null;  // all localized strings


	/**
	 * Prepares and loads the given localization file
	 * @param {Object} options
	 * @param {Function} onReady callback on the given language load or on failure
	 */
	module.init = function ( options, onReady ) {
		// defaults
		options.name = options.name || 'en';
		options.ext  = options.ext  || 'js';
		options.path = options.path || 'lang';
        // reset for english
        data = null;
		// load localization only for non-english language
		if ( options.name !== 'en' ) {
			loadScript(options.path + '/' + options.name + '.' + options.ext, onReady, onReady);
		} else {
			// and run callback
			if ( typeof onReady === 'function' ) {
				onReady();
			}
		}
	};


	/**
	 * Wrapper to receive the incoming data
	 * @param {Object} input
	 */
	module.load = function ( input ) {
		data = input;
	};


	/**
	 * Localized string getter
	 * @param {string} key string to localize (in english)
	 * @return {string}
	 */
	module.data = function ( key ) {
		if (data === null) {
			return key;
		} else {
			return data[key] !== undefined ? data[key] : key;
		}
	};


	// export
	return module;

})();


// short alias
var _ = gettext.data;
