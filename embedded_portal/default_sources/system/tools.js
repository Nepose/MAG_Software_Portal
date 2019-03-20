/**
 * Set of base functionality tools
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

'use strict';

/* jshint unused:false */

// debug print blank placeholder for release builds
if ( window.echo === undefined ) { window.echo = function ( data, title ) {}; }


/**
 * Assigns a list of attribute values to the given object
 * @param {Node|Element|HTMLElement} obj html element
 * @param {Object} attr list of attributes with values
 * @return {Node|Element|HTMLElement} the same as the given one
 * @example
 *   elattr(myimg, {src:'face.png', className:'main'});
 */
function elattr ( obj, attr ) {
	// check if Node and valid attr list
	if ( obj && obj.nodeType && attr && attr instanceof Object ) {
		// assign attributes
		for ( var key in attr ) {
			if ( attr.hasOwnProperty(key) ) { obj[key] = attr[key]; }
		}
	}
	return obj;
}


/**
 * Creates a DOM element with given options
 * @param {string} name html element name (a, img, div, ...)
 * @param {Object} [attr] list of attributes with values
 * @param {Node|Element|HTMLElement|Array|string|number} [data] inner html value
 * @return {Node|Element|HTMLElement}
 * @example
 *   element('div', {}, 'some text');
 *   element('div', {}, [element('span'), element('br')]);
 *   element('link', {rel:'stylesheet', type:'text/css', href:'http://some.url/'});
 */
function element ( name, attr, data ) {
	var tag = document.createElement(name);
	// set attributes
	elattr(tag, attr);
	// add to the dom
	elchild(tag, data);
	// Node is ready
	return tag;
}


/**
 * Adds the given value to the obj as a child recursively
 * @param {Node|Element|HTMLElement} obj element to be appended
 * @param value data to add (simple text values, Nodes, array of Nodes)
 * @return {Node|Element|HTMLElement} owner element of all added data
 * @example
 *   elchild(mydiv, 'Hello world'); // simple text value
 *   elchild(mydiv, someotherdiv); // Node
 *   elchild(mydiv, [div1, div2, div3]); // Node list
 *   elchild(mydiv, [div1, 'hello', 'world']); // combined case
 */
function elchild ( obj, value ) {
	// check input
	if ( obj && value ) {
		// Node
		if ( value.nodeType ) { obj.appendChild(value); }
		// array of Nodes of simple values
		else if ( Array.isArray(value) ) {
			for ( var i = 0; i < value.length; i++ ) { elchild(obj, value[i]); }
		}
		// simple values
		else {
			obj.appendChild(document.createTextNode(value));
		}
	}
	return obj;
}


/**
 * Removes all child elements from the given object
 * @param {Node|Element|HTMLElement} obj html element to be updated
 * @return {Node|Element|HTMLElement} cleared element
 */
function elclear ( obj ) {
	// check input
	if ( obj !== null && obj.nodeName && obj.hasChildNodes() ) {
		// clearing
		while ( obj.hasChildNodes() ) { obj.removeChild(obj.firstChild); }
	}
	return obj;
}


/**
 * Loads the given JavaScript file dynamically
 * head injection method is used
 * @param {string} src file to be loaded
 * @param {Function} [onload] optional on ready handler
 * @param {Function} [onerror] optional on error handler
 */
function loadScript ( src, onload, onerror ) {
	// Node init
	var elem = document.createElement('script');
	elem.type = 'text/javascript';
	elem.src = src;
	// set handlers if given
	if ( typeof onload === 'function' ) { elem.onload = onload; }
	if ( typeof onerror === 'function' ) { elem.onerror = onerror; }
	// push to dom
	document.head.appendChild(elem);
}


/**
 * Returns the active language (from the available lang list)
 * @param {Array} [langList] the set of available valid language names
 * @return {string} lowercase lang name
 */
function getCurrentLanguage ( langList ) {
	var langEnv = JSON.parse(gSTB.GetEnv('{"varList":["language"]}')),
		langVal = 'en';
	// reset valid languages if necessary
	langList = langList || ['en', 'ru', 'uk', 'de', 'tr'/*, 'el', 'es', 'bg'*/];
	// no errors and valid string
	if ( !langEnv.errMsg && langEnv.result && langEnv.result.language && typeof langEnv.result.language === 'string' ) {
		// make sure it is lowercase
		langEnv.result.language = langEnv.result.language.toLowerCase();
		// the lang is from valid list
		if ( langList.indexOf(langEnv.result.language) !== -1 ) { langVal = langEnv.result.language; }
	}
	return langVal;
}

/**
 * Returns the list of environment variables
 * @param {Array} list array of variables names
 * @returns {Object|boolean} return hash if all alright and false if there is some error
 */
function getEnvList ( list ) {
	var data;
	try {
		data = JSON.parse(gSTB.GetEnv(JSON.stringify({varList: list})));
		if ( data.errMsg !== '' ) {
			throw new Error(data.errMsg);
		}
		return data.result;
	} catch ( e ) {
		echo(e);
	}
	return false;
}

/**
 * Return specified environment variable
 * @param {string} name variable name
 * @returns {Object|boolean} return string with  if all alright
 */
function getEnv ( name ) {
	var data = getEnvList([name]);
	if ( data !== false && data[name] !== undefined ) {
		return data[name];
	}
	return data;
}

/**
 * Set some environment variable
 * @param {string} key variable name
 * @param {string|number} value variable value
 * @returns {boolean} true if all alright and false if there is some error
 */
function setEnv ( key, value ) {
	var vars = {};
	vars[key] = value;
	return setEnvList(vars);
}

/**
 * Set several environment variables
 * @param {Object} hash object where key is the variable name and the value is the variable value
 * @returns {boolean} true if all alright and false if there is some error
 */
function setEnvList ( hash ) {
	try {
		return gSTB.SetEnv(JSON.stringify(hash));
	} catch ( e ) {
		echo(e);
	}
	return false;
}

/**
 * Prepare global event object - add the real key code
 * should be called only once at the beginning of events chain
 * with shift key pressed +1000
 * with alt key pressed +2000
 * @param {Event} event object to be altered
 * @param {boolean} [stopBubble=true] stops all propagation of the event in the bubbling phase
 * @param {string} [label] optional text info for debug
 * @returns {boolean} true - valid event; false - phantom and should be skipped
 */
function eventPrepare ( event, stopBubble, label ) {
	// prevent double invoke
	if ( event.code !== undefined ) { return true; }
	// determine real key code
	event.code = event.keyCode || event.which;
	// filter phantoms
	if ( event.code === 0 ) { return false; }
	// apply key modifiers
	if ( event.shiftKey ) { event.code += 1000; }
	if ( event.altKey ) { event.code += 2000; }
	// stop deprecated usb event
	if ( event.code === KEYS.USB_MOUNTED || event.code === KEYS.USB_UNMOUNTED ) { return false; }
	// stop bubbling if necessary
	if ( stopBubble !== false ) { event.stopPropagation(); }
	// debug
	echo(event.code + '\t' + event.shiftKey + '\t' + event.ctrlKey + '\t' + event.altKey + '\t' + event.srcElement.id + '\t' + event.target.id + '\t' + (label || ''),
		'keyDown [code/shift/ctrl/alt/src/target]');
	return true;
}


// global flag to prevent ajax queries
ajax.stop = false;

/**
 * Ajax request
 * @param {string} method "post", "get" or "head"
 * @param {string} url address
 * @param {Function} callback on
 * @param {Object} [headers] list of optional headers like "charset", "Content-Type" and so on
 * @param {string} [type=text] data parsing mode: plain text (default), xml, json
 * @param {boolean} [async=true] send asynchronous request
 * @return {XMLHttpRequest} request object in case response headers are necessary
 * @example
 *   ajax('get', 'https://google.com/', function(data, status){console.info(data, status);}, {charset:'utf-8'})
 */
function ajax ( method, url, callback, headers, type, async ) {
	var hname, jdata = null, timeout = null, xhr = new XMLHttpRequest(), title = 'AJAX ' + method.toUpperCase() + ' ' + url;
	async = async !== false;
	xhr.onreadystatechange = function () {
		if ( xhr.readyState === 4 ) {
			clearTimeout(timeout);
			if ( ajax.stop ) {
				echo(xhr.status, title);
				if ( typeof callback === 'function' ) { callback(null, null, null); }
			} else {
				echo('status:' + xhr.status + ', length:' + xhr.responseText.length, title);
				//echo(xhr.responseText, title);
				if ( type === 'json' && xhr.status === 200 ) {
					try {
						jdata = JSON.parse(xhr.responseText);
					} catch ( e ) {
						echo(e, 'AJAX JSON.parse');
						jdata = null;
					}
				}
				if ( typeof callback === 'function' ) {
					callback(type === 'xml' ? xhr.responseXML : (type === 'json' ? jdata : xhr.responseText), xhr.status, xhr);
				}
			}
		}
	};
	xhr.open(method, url, async);
	// set headers if present
	if ( headers ) {
		for ( hname in headers ) {
			if ( headers.hasOwnProperty(hname) ) {
				xhr.setRequestHeader(hname, headers[hname]);
			}
		}
	}
	xhr.send();
	echo('sent', title);
	// abort after some time (60s)
	timeout = setTimeout(function () {
		xhr.abort();
		echo('ABORT on timeout', title);
		if ( typeof callback === 'function' ) {
			callback(null, 0);
		}
	}, 60000);
	return xhr;
}


/**
 * Preloads a list of images and executes the given callback at the end
 * @param {Array} imgList images to load
 * @param {Function} [callback]
 */
function imageLoader ( imgList, callback ) {
	var count = 1,  // loading image number
		onload = function () {
			// all images are loaded and there is a valid callback
			if ( imgList.length === count && typeof callback === 'function' ) {
				callback();
			} else {
				count++;
			}
		};
	// create set of loading images
	if ( Array.isArray(imgList) && imgList.length > 0 ) {
		imgList.forEach(function ( item ) {
			var img = new Image();
			img.src = item;
			img.onload = onload;
			img.onerror = function(){
				throw ('Image ' + item + ' load fail');
			};
		});
	} else if ( imgList.length === 0 ) {
		// nothing was given so fire at once
		callback();
	}
}


/**
 * get the list of all storages (external usb and internal hdd)
 */
function getStorageInfo () {
	var snList = {};  // set of all serial numbers with amount of partitions on each

	// get mount points
	var info = JSON.parse(gSTB.GetStorageInfo('{}'));
	// valid non-empty data
	if ( Array.isArray(info.result) && info.errMsg === '' && info.result.length > 0 ) {
		info.result.forEach(function ( item ) {
			// SD card-reader support
			item.mediaType = item.sn === '000022272228' ? 3 : item.mediaType;

			item.label = item.label.trim();
			if ( snList[item.sn] ) {
				snList[item.sn]++;
			} else {
				snList[item.sn] = 1;
			}
		});
		info.result.forEach(function ( item ) {
			if ( !item.label ) {
				item.label = item.vendor + ' ' + item.model.replace(/\//, '');
				if ( snList[item.sn] > 1 ) {
					item.label += ' #' + item.partitionNum;
				}
			}

			if ( item.isReadOnly ) {
				item.label += ' (' + _('Read only') + ')';
			}
		});
		// sort by mount path
		info.result.sort(function ( a, b ) {
			return a.mountPath < b.mountPath ? -1 : 1;
		});
		// final list of all combined data
		window.STORAGE_INFO = info.result;
	} else {
		// reset if error
		window.STORAGE_INFO = [];
	}

	// get hdd data
	try {
		window.HDD_INFO = JSON.parse(gSTB.RDir('get_hdd_info') || '[]');
	} catch ( e ) {
		echo(e, 'get_hdd_info');
		window.HDD_INFO = [];
	}

	echo(STORAGE_INFO, 'STORAGE_INFO');
	echo(HDD_INFO, 'HDD_INFO');
}


/**
 * URL parsing tool
 * (c) Steven Levithan <stevenlevithan.com>
 * MIT License
 */
function parseUri ( str ) {
	var o   = parseUri.options,
		m   = o.parser[o.strictMode ? 'strict' : 'loose'].exec(str),
		uri = {},
		i   = 14;

	while ( i-- ) { uri[o.key[i]] = m[i] || ''; }

	uri[o.q.name] = {};
	uri[o.key[12]].replace(o.q.parser, function ( $0, $1, $2 ) {
		if ( $1 ) { uri[o.q.name][$1] = $2; }
	});

	return uri;
}

parseUri.options = {
	strictMode: false,
	key       : ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'],
	q         : {
		name  : 'queryKey',
		parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	},
	parser    : {
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		loose : /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	}
};

/**
 * Returns whether the passed string is valid url
 * @param {string} url
 * @param {boolean} [sol=false] check solution
 * @param {boolean} [isSolutionOptional=false] is solution optional or not
 * @param {boolean} [isProtocolOptional=true] is protocol scheme optional or not
 * @returns {boolean}
 */
function validateUrl ( url, sol, isSolutionOptional, isProtocolOptional ) {
	var solReg = '((ffmpeg|auto|rtp|rtsp|mp3|mpegps|mpegts|mp4|ifm|fm|ffrt|ffrt2|ffrt3|ffrt4)(\\s))';

	isProtocolOptional = typeof isProtocolOptional === typeof true ? isProtocolOptional : true;

	return new RegExp('^' + (sol ? solReg : '') + ['', '?'][+!!isSolutionOptional] + "(((http|https|udp|rtp|rtsp|mms|mmsh|mmst|rtmp|igmp):\\/\\/)" + ['', '?'][+isProtocolOptional] + "@?(([a-zA-Z0-9а-яА-Я$\\-_.+!*'(),;:&=]|%[0-9a-fA-Fа-яА-Я]{2})+@)?(((25[0-5]|2[0-4][0-9]|[0-1][0-9][0-9]|[1-9][0-9]|[0-9])(\\.(25[0-5]|2[0-4][0-9]|[0-1][0-9][0-9]|[1-9][0-9]|[0-9])){3})|localhost|([a-zA-Zа-яА-Я0-9\\-\\u00C0-\\u017F]+\\.)+([a-zA-Zа-яА-Я]{2,}))(:[0-9]+)?|((file:\/\/\/|\/)[a-zA-Zа-яА-Я0-9\\-\\u00C0-\\u017F]+))(\\/(([a-zA-Zа-яА-Я0-9$\\-_.+!*'(),;:@&=\\s]|%[0-9a-fA-Fа-яА-Я]{2})*(\\/([a-zA-Zа-яА-Я0-9$\\-_.+!*'(),;:@&=\\s]|%[0-9a-fA-Fа-яА-Я]{2})*)*)?(\\?([a-zA-Zа-яА-Я0-9$\\-_.+!*'(),;:@&=\\/?]|%[0-9a-fA-Fа-яА-Я]{2})*)?(\\#([a-zA-Zа-яА-Я0-9$\\-_.+!*'(),;:@&=\\/?]|%[0-9a-fA-Fа-яА-Я]{2})*)?)?$").test(url);
}


/**
 * Combines two objects and write result to target object
 * @param {Object} target object to which the data will be transferred
 * @param {Object} source object from which the data will be transferred
 * @param [override = true] if set to false target object not rewriting, result of combining returns from function
 * @returns {Object} combined object
 */
function extend (target, source, override) {
	var _target = (override === false ? extend({}, target) : target || {});
	for (var prop in source) {
		if ( typeof _target[prop] === 'object' && typeof source[prop] === 'object' && !Array.isArray(_target[prop]) && !Array.isArray(source[prop]) ) {
			_target[prop] = extend(_target[prop], source[prop], override);
		} else {
			_target[prop] = source[prop];
		}
	}
	return _target;
}


/**
 * Converts the given string to utf8 and then to base64
 * @param {string} data string to convert
 * @return {string}
 */
function base64Encode ( data ) {
	return btoa(unescape(encodeURIComponent(data)));
}


/**
 * Converts the given string from base64 to utf8 and then to utf16
 * @param {string} data string to convert
 * @return {string}
 */
function base64Decode ( data ) {
	try {
		return decodeURIComponent(escape(atob(data)));
	} catch(error) {
		echo(error, 'base64Decode Error');
	}
}


if ( !('classList' in document.documentElement) ) {
	var prototype = Array.prototype,
	indexOf = prototype.indexOf,
	slice = prototype.slice,
	push = prototype.push,
	splice = prototype.splice,
	join = prototype.join;

	window.DOMTokenList = function(el) {
		this._element = el;
		if (el.className !== this._classCache) {
			this._classCache = el.className;
			if (!this._classCache) { return; }
			var classes = this._classCache.replace(/^\s+|\s+$/g,'').split(/\s+/),
				i;
			for (i = 0; i < classes.length; i++) {
				push.call(this, classes[i]);
			}
		}
	};
	window.DOMTokenList.prototype = {
		add: function(token) {
			if(this.contains(token)) {
				return;
			}
			push.call(this, token);
			this._element.className = slice.call(this, 0).join(' ');
		},
		contains: function(token) {
			return indexOf.call(this, token) !== -1;
		},
		item: function(index) {
			return this[index] || null;
		},
		remove: function(token) {
			var i = indexOf.call(this, token);
			if (i === -1) {
				return;
			}
			splice.call(this, i, 1);
			this._element.className = slice.call(this, 0).join(' ');
		},
		toString: function() {
			return join.call(this, ' ');
		},
		toggle: function(token) {
			if (!this.contains(token)) {
				this.add(token);
			} else {
				this.remove(token);
			}
			return this.contains(token);
		}
	};

	Object.defineProperty(Element.prototype, 'classList',{
		get: function () {
			return new window.DOMTokenList(this);
		}
	});
}


/**
 * Object represents simple event model
 * @type {{ bind: Function, trigger: Function, inject: Function}}
 */
var Events = {
	/**
	 * Assign new event to the current object
	 * @param {string|Object} event Event name or Object where the key is event name and value is handler
	 * @param {Function} callback Function that will be executed when event was triggered
	 */
	bind: function ( event, callback ) {
		this._events || (this._events = {});
		if ( typeof event === 'object' ) {
			for ( var name in event ) {
				this.bind(name, event[name]);
			}
		} else if ( typeof event === 'string' && typeof callback === 'function' ) {
			if ( this._events[event] === undefined ) {
				this._events[event] = [];
			}
			this._events[event].push(callback);
		}
	},

	/**
	 * Trigger some event
	 * @param {string} event Name of events which will be triggered
	 */
	trigger: function ( event, data ) {
		var result, results = [], self = this;
		if ( event !== undefined && this._events !== undefined && this._events[event] !== undefined ) {
			this._events[event].forEach(function ( ev ) {
					result = ev.call(self, data);
					if ( result !== undefined ) { results.push(result); }
				}
			);
		}
		return results;
	},

	/**
	 * Remove event handlers for specified event
	 * @param {string} event Name of removed event
	 */
	unbind: function(event){
		delete this._events[event];
	},

	/**
	 * Inject current functionality to another object or function
	 * @param {Object|Function} obj Object which is embedded functionality
	 */
	inject: function( obj ){
		if (typeof obj === 'function'){
			extend(obj.prototype, this);
		}else if (typeof obj === 'object'){
			extend(obj, this);
		}
	}
};


/**
 * Cuts to the specified number of chars and append an ellipsis
 * @param {string} text  String to cut
 * @param {number} length  The length to which you want to truncate the string
 * @returns {string}
 */
function cutTextWithEllipsis ( text, length ) {
	if ( text.length > length ) {
		return text.toString().slice(0, length) + '...';
	}
	return text;
}


/**
 * Parse date string and return date without time zone
 * @param {string} dateStr date string in EST or UTC format
 */
var timeZoneOffsets = {'A':{'index':-1,'minutes':60},'ACDT':{'index':-1,'minutes':60},'ACST':{'index':-1,'minutes':570},
	'ACT':{'index':1,'minutes':300},'ACWST':{'index':-1,'minutes':525},'ADT':{'index':1,'minutes':180},
	'AEDT':{'index':-1,'minutes':61},'AEST':{'index':-1,'minutes':60},'AFT':{'index':-1,'minutes':270},
	'AKDT':{'index':1,'minutes':480},'AKST':{'index':1,'minutes':540},'ALMT':{'index':-1,'minutes':360},
	'AMST':{'index':1,'minutes':180},'AMT':{'index':1,'minutes':240},'ANAST':{'index':-1,'minutes':62},
	'ANAT':{'index':-1,'minutes':62},'AQTT':{'index':-1,'minutes':300},'ART':{'index':1,'minutes':180},
	'AST':{'index':1,'minutes':240},'AWDT':{'index':-1,'minutes':540},'AWST':{'index':-1,'minutes':480},
	'AZOST':{'index':0,'minutes':0},'AZOT':{'index':1,'minutes':60},'AZST':{'index':-1,'minutes':300},
	'AZT':{'index':-1,'minutes':240},'B':{'index':-1,'minutes':120},'BNT':{'index':-1,'minutes':480},
	'BOT':{'index':1,'minutes':240},'BRST':{'index':1,'minutes':120},'BRT':{'index':1,'minutes':180},
	'BST':{'index':-1,'minutes':60},'BTT':{'index':-1,'minutes':360},'C':{'index':-1,'minutes':180},
	'CAST':{'index':-1,'minutes':480},'CAT':{'index':-1,'minutes':120},'CCT':{'index':-1,'minutes':390},
	'CDT':{'index':1,'minutes':300},'CEST':{'index':-1,'minutes':120},'CET':{'index':-1,'minutes':60},
	'CHADT':{'index':-1,'minutes':63},'CHAST':{'index':-1,'minutes':62},'CHOT':{'index':-1,'minutes':480},
	'CHUT':{'index':-1,'minutes':600},'CKT':{'index':1,'minutes':60},'CLST':{'index':1,'minutes':180},
	'CLT':{'index':1,'minutes':240},'COT':{'index':1,'minutes':300},'CST':{'index':1,'minutes':360},
	'CVT':{'index':1,'minutes':60},'CXT':{'index':-1,'minutes':420},'ChST':{'index':-1,'minutes':60},
	'D':{'index':-1,'minutes':240},'DAVT':{'index':-1,'minutes':420},'E':{'index':-1,'minutes':300},
	'EASST':{'index':1,'minutes':300},'EAST':{'index':1,'minutes':360},'EAT':{'index':-1,'minutes':180},
	'ECT':{'index':1,'minutes':300},'EDT':{'index':-1,'minutes':61},'EEST':{'index':-1,'minutes':180},
	'EET':{'index':-1,'minutes':120},'EGST':{'index':0,'minutes':0},'EGT':{'index':1,'minutes':60},
	'EST':{'index':1,'minutes':300},'ET':{'index':1,'minutes':300},'F':{'index':-1,'minutes':360},
	'FET':{'index':-1,'minutes':180},'FJST':{'index':-1,'minutes':63},'FJT':{'index':-1,'minutes':62},
	'FKST':{'index':1,'minutes':180},'FKT':{'index':1,'minutes':240},'FNT':{'index':1,'minutes':120},
	'G':{'index':-1,'minutes':420},'GALT':{'index':1,'minutes':360},'GAMT':{'index':1,'minutes':540},
	'GET':{'index':-1,'minutes':240},'GFT':{'index':1,'minutes':180},'GILT':{'index':-1,'minutes':62},
	'GMT':{'index':0,'minutes':0},'GST':{'index':-1,'minutes':240},'GYT':{'index':1,'minutes':240},
	'H':{'index':-1,'minutes':480},'HAA':{'index':1,'minutes':180},'HAC':{'index':1,'minutes':300},
	'HADT':{'index':1,'minutes':540},'HAE':{'index':1,'minutes':240},'HAP':{'index':1,'minutes':420},
	'HAR':{'index':1,'minutes':360},'HAST':{'index':1,'minutes':60},'HAT':{'index':1,'minutes':150},
	'HAY':{'index':1,'minutes':480},'HKT':{'index':-1,'minutes':480},'HLV':{'index':1,'minutes':270},
	'HNA':{'index':1,'minutes':240},'HNC':{'index':1,'minutes':360},'HNE':{'index':1,'minutes':300},
	'HNP':{'index':1,'minutes':480},'HNR':{'index':1,'minutes':420},'HNT':{'index':1,'minutes':210},
	'HNY':{'index':1,'minutes':540},'HOVT':{'index':-1,'minutes':420},'I':{'index':-1,'minutes':540},
	'ICT':{'index':-1,'minutes':420},'IDT':{'index':-1,'minutes':180},'IOT':{'index':-1,'minutes':360},
	'IRDT':{'index':-1,'minutes':270},'IRKST':{'index':-1,'minutes':540},'IRKT':{'index':-1,'minutes':540},
	'IRST':{'index':-1,'minutes':210},'IST':{'index':-1,'minutes':60},'JST':{'index':-1,'minutes':540},
	'K':{'index':-1,'minutes':60},'KGT':{'index':-1,'minutes':360},'KOST':{'index':-1,'minutes':660},
	'KRAST':{'index':-1,'minutes':480},'KRAT':{'index':-1,'minutes':480},'KST':{'index':-1,'minutes':540},
	'KUYT':{'index':-1,'minutes':240},'L':{'index':-1,'minutes':61},'LHDT':{'index':-1,'minutes':61},
	'LHST':{'index':-1,'minutes':60},'LINT':{'index':-1,'minutes':64},'M':{'index':-1,'minutes':62},
	'MAGST':{'index':-1,'minutes':62},'MAGT':{'index':-1,'minutes':62},'MART':{'index':1,'minutes':570},
	'MAWT':{'index':-1,'minutes':300},'MDT':{'index':1,'minutes':360},'MESZ':{'index':-1,'minutes':120},
	'MEZ':{'index':-1,'minutes':60},'MHT':{'index':-1,'minutes':62},'MMT':{'index':-1,'minutes':390},
	'MSD':{'index':-1,'minutes':240},'MSK':{'index':-1,'minutes':240},'MST':{'index':1,'minutes':420},
	'MUT':{'index':-1,'minutes':240},'MVT':{'index':-1,'minutes':300},'MYT':{'index':-1,'minutes':480},
	'N':{'index':1,'minutes':60},'NCT':{'index':-1,'minutes':61},'NDT':{'index':1,'minutes':150},
	'NFT':{'index':-1,'minutes':61},'NOVST':{'index':-1,'minutes':420},'NOVT':{'index':-1,'minutes':360},
	'NPT':{'index':-1,'minutes':345},'NRT':{'index':-1,'minutes':720},'NST':{'index':1,'minutes':210},
	'NUT':{'index':1,'minutes':61},'NZDT':{'index':-1,'minutes':63},'NZST':{'index':-1,'minutes':62},
	'O':{'index':1,'minutes':120},'OMSST':{'index':-1,'minutes':420},'OMST':{'index':-1,'minutes':420},
	'ORAT':{'index':-1,'minutes':300},'P':{'index':1,'minutes':180},'PDT':{'index':1,'minutes':420},
	'PET':{'index':1,'minutes':300},'PETST':{'index':-1,'minutes':62},'PETT':{'index':-1,'minutes':62},
	'PGT':{'index':-1,'minutes':60},'PHOT':{'index':-1,'minutes':63},'PHT':{'index':-1,'minutes':480},
	'PKT':{'index':-1,'minutes':300},'PMDT':{'index':1,'minutes':120},'PMST':{'index':1,'minutes':180},
	'PONT':{'index':-1,'minutes':61},'PST':{'index':1,'minutes':480},'PT':{'index':1,'minutes':480},
	'PWT':{'index':-1,'minutes':540},'PYST':{'index':1,'minutes':180},'PYT':{'index':1,'minutes':240},
	'Q':{'index':1,'minutes':240},'QYZT':{'index':1,'minutes':360},'R':{'index':1,'minutes':300},
	'RET':{'index':-1,'minutes':240},'S':{'index':1,'minutes':360},'SAKT':{'index':1,'minutes':600},
	'SAMT':{'index':-1,'minutes':240},'SAST':{'index':-1,'minutes':120},'SBT':{'index':-1,'minutes':61},
	'SCT':{'index':-1,'minutes':240},'SGT':{'index':-1,'minutes':480},'SRET':{'index':-1,'minutes':660},
	'SRT':{'index':1,'minutes':180},'SST':{'index':1,'minutes':61},'T':{'index':1,'minutes':420},
	'TAHT':{'index':1,'minutes':60},'TFT':{'index':-1,'minutes':300},'TJT':{'index':-1,'minutes':300},
	'TKT':{'index':-1,'minutes':63},'TLT':{'index':-1,'minutes':540},'TMT':{'index':-1,'minutes':300},
	'TOT':{'index':-1,'minutes':780},'TVT':{'index':-1,'minutes':62},'U':{'index':1,'minutes':480},
	'ULAT':{'index':-1,'minutes':480},'UTC':{'index':0,'minutes':0},'UYST':{'index':1,'minutes':120},
	'UYT':{'index':1,'minutes':180},'UZT':{'index':-1,'minutes':300},'V':{'index':1,'minutes':540},
	'VET':{'index':1,'minutes':270},'VLAST':{'index':-1,'minutes':61},'VLAT':{'index':-1,'minutes':61},
	'VUT':{'index':-1,'minutes':61},'W':{'index':1,'minutes':60},'WARST':{'index':1,'minutes':180},
	'WAST':{'index':-1,'minutes':120},'WAT':{'index':-1,'minutes':60},'WEST':{'index':-1,'minutes':60},
	'WESZ':{'index':-1,'minutes':60},'WET':{'index':0,'minutes':0},'WEZ':{'index':0,'minutes':0},
	'WFT':{'index':-1,'minutes':62},'WGST':{'index':1,'minutes':120},'WGT':{'index':1,'minutes':180},
	'WIB':{'index':-1,'minutes':420},'WIT':{'index':-1,'minutes':540},'WITA':{'index':-1,'minutes':480},
	'WST':{'index':-1,'minutes':63},'WT':{'index':0,'minutes':0},'X':{'index':1,'minutes':61},
	'Y':{'index':1,'minutes':62},'YAKST':{'index':-1,'minutes':60},'YAKT':{'index':-1,'minutes':60},
	'YAPT':{'index':-1,'minutes':60},'YEKST':{'index':-1,'minutes':360},'YEKT':{'index':-1,'minutes':360},
	'Z':{'index':0,'minutes':0},'-12':{'index':-1,'minutes':720},'-11':{'index':-1,'minutes':660},
	'-10':{'index':-1,'minutes':600},'-09':{'index':-1,'minutes':540},'-08':{'index':-1,'minutes':480},
	'-07':{'index':-1,'minutes':420},'-06':{'index':-1,'minutes':360},'-05':{'index':-1,'minutes':300},
	'-04':{'index':-1,'minutes':240},'-03':{'index':-1,'minutes':180},'-02':{'index':-1,'minutes':120},
	'-01':{'index':-1,'minutes':60},'+01':{'index':1,'minutes':60},'+02':{'index':1,'minutes':120},
	'+03':{'index':1,'minutes':180},'+04':{'index':1,'minutes':240},'+05':{'index':1,'minutes':300},
	'+06':{'index':1,'minutes':360},'+07':{'index':1,'minutes':420},'+08':{'index':1,'minutes':480},
	'+09':{'index':1,'minutes':540},'+10':{'index':1,'minutes':600},'+11':{'index':1,'minutes':660},
	'+12':{'index':1,'minutes':720}};

/**
 * Get a Date object from given string
 * @param  {string} dateStr String which contains date
 * @return {Date}         Object if dateStr is normal date, else return Invalid Date object
 * TODO: if each incoming dateStr will be in the format such as 'Thu Nov 13 18:23:05 EET 2014',
 * where EET - is timezone, and there is so much this function calls,
 * parsing dateStr can be a little faster with using split lines on the ' ' to array,
 * where 4 index is timezone
 */
function parseDate ( dateStr ) {
	if ( !dateStr ) { return new Date(NaN);}

	var date = new Date(dateStr.match(/\w{3}\s\w{3}\s\d{1,2}\s\d{1,2}:\d{1,2}:\d{1,2}/) + ' ' + dateStr.match(/\d{4}/)),
		timeZone = dateStr.match(/(\w{1,4}|((\+|-)\d{1,2}))\s+\d{4}/)[1],
		offset = timeZoneOffsets[timeZone];

	date.setMinutes(date.getMinutes() - (date.getTimezoneOffset())); // remove influence of device local time zone
	if ( offset.index !== 0 ) {
		date.setMinutes(date.getMinutes() + (offset.minutes || 0) * offset.index);
	}
	return date;
}


function getMediaType ( file ) {
	var extension = file.split('.').pop().toLowerCase();
	if ( extension && configuration.registersTypes.indexOf(extension) !== -1 ) {
		for ( var i = 0, type; i < MEDIA_TYPES.length, type = MEDIA_TYPES[i]; i++ ) {
			if ( MEDIA_EXTENSION[type].indexOf(extension) !== -1 ) { return type; }
		}
	}
	return MEDIA_TYPE_NONE;
}


/**
 * Generic randomize function
 */
Array.prototype.shuffle = function () {
	var n = this.length,
		i, tmp;
	while ( n-- ) {
		i   = Math.floor(n * Math.random());
		tmp = this[i];
		this[i] = this[n];
		this[n] = tmp;

	}
	return this;
};

function readJSON ( path, fileName ) {
	var result,
		xmlhttp = new XMLHttpRequest();

	path = path + '/' + fileName;

	try {
		xmlhttp.open('GET', path, false);
		xmlhttp.send(null);
		result = xmlhttp.responseText;
	} catch ( e ) {
		echo(e, 'some xmlhttp error');
		result = '';
	}
	echo(result, 'file ' + path);
	return result;
}
