'use strict';

/**
 * Class for button with images panel.
 * @class CButtonPanel
 * @constructor
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */
function CButtonPanel ( parent ) {
	// parent constructor
	CBase.call(this, parent);

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CButtonPanel';

	/**
	 * CSS class name associated with the component
	 * @type {string}
	 */
	this.baseClass = 'cbpanel-main';

	/**
	 * directory with icons
	 * depends on screen resolution
	 * @type {string}
	 */
	this.path = '';

	/**
	 * Flag to indicate the component state
	 * @type {boolean}
	 */
	this.isActive = true;
}

// extending
CButtonPanel.prototype = Object.create(CBase.prototype);
CButtonPanel.prototype.constructor = CButtonPanel;


/**
 * Component initialization with image path set.
 * Should be called once before use just after constructor invoke and all hooks preparation.
 * @param {string} path image path dependant on resolution
 * @param {Node} [handle] component placeholder
 */
CButtonPanel.prototype.Init = function ( path, handle ) {
	// global image path
	this.path = path;

	if ( handle && handle.nodeName ) {
		// parent call init with placeholder
		CBase.prototype.Init.call(this, handle);
	} else {
		// parent call init with placeholder
		CBase.prototype.Init.call(this, element('div', {className:'cbpanel-main'}));
	}
};


/**
 * Append a new button
 * @param {number} code keydown code
 * @param {string} icon file of the button icon
 * @param {string} text button title
 * @param {Function} callback click/keyboard handler
 * @param {boolean} [hidden=false] is button visible
 * @returns {Node}
 */
CButtonPanel.prototype.Add = function ( code, icon, text, callback, hidden ) {
	// prepare text
	var html = null,
		self = this,
		func = function(){
			if ( self.isActive && typeof callback === 'function' ) {
				gSTB.HideVirtualKeyboard();
				callback(code);
			}
		};
	if ( text ) {
		html = element('div', {className:'cbpanel-text', onclick:func});
		html.innerHTML = text;
	}
	// build button item
	var item = element('div', {className:'cbpanel-item', data:{code:code, onclick:func}}, [
		element('img', {className:'cbpanel-icon', onclick:func, src:this.path + '/' + icon}),
		html
	]);
	item.$name = html;
	// apply visibility option
	this.Hidden(item, hidden || false);
	// add to component container
	elchild(this.handleInner, item);
	return item;
};


/**
 * Manage the given item visibility
 * @param {Node} item the group element to alter
 * @param {boolean} state true - set hidden; false - set visible
 */
CButtonPanel.prototype.Hidden = function ( item, state ) {
	// valid group object and states are different
	if ( item && item.nodeName && item.data.hidden !== state ) {
		// set inner attribute
		item.data.hidden = state;
		// actual show/hide
		item.style.display = state ? 'none' : 'table-cell';
	}
};

/**
 * Set the given button name
 * @param {Node} item the group element to alter
 * @param {string} name new button name
 */
CButtonPanel.prototype.SetName = function ( item, name ) {
	var html = null;

	if ( item && item.nodeName && name ) {
		if ( item.$name ) {
			this.Rename(item, name);
		} else {
			html = element('div', {className:'cbpanel-text', onclick:item.data.onclick});
			html.innerHTML = name;
			item.$name = html;
			item.appendChild(html);
		}
	}
};

/**
 * Manage the given button name
 * @param {Node} item the group element to alter
 * @param {string} name new button name
 */
CButtonPanel.prototype.Rename = function ( item, name ) {
	// valid group object and states are different
	if ( item && item.nodeName) {
		// actual rename
		item.$name.innerHTML = name;
	}
};

/**
 * Makes the component active or disable it to start/stop event handling
 * @param {boolean} [active=true]
 */
CButtonPanel.prototype.Activate = function ( active ) {
	this.isActive = active !== false;
};


/**
 * Handle external events
 * @param {Event} event global event object
 */
CButtonPanel.prototype.EventHandler = function ( event ) {
	if ( event.stopped === true ) {
		return;
	}
	if ( this.isActive ) {
		// iterate all items
		for ( var i = 0, data, items = this.handleInner.children, length = items.length; i < length; i++ ) {
			data = items[i].data;
			// check data, visibility and validate id
			if ( !data.hidden && data.code === event.code && typeof data.onclick === 'function' ) {
				if ( data.onclick() ) {
					// stop event spreading
					event.preventDefault();
				}
				return;
			}
		}
	}
};


/**
 * Can handle a mouse click
 */
CButtonPanel.prototype.onClick = function () {
	return false;
};
