/**
 * Component: Bluetooth list
 * Bluetooth list with navigation
 * @author Aleynikov Boris
 * @extends CScrollList
 */

'use strict';

/**
 * @class CBtList
 * @constructor
 */
function CBtList ( parent, onClickHandler ) {
	// parent constructor
	CScrollList.call(this, parent);

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CBtList';

	/**
	 * Devices
	 * @type {Array}
	 */
	this.devices = null;

	/**
	 * On item click handler
	 * @type {function}
	 */
	this.onClickHandler = onClickHandler;

	// class names based on types
	this.types = ['new', 'paired', 'paired connected'];
}

CBtList.prototype = Object.create(CScrollList.prototype);
CBtList.prototype.constructor = CBtList;


/**
 * Set devices data
 * @param {[Object]} devices
 */
CBtList.prototype.SetData = function ( devices ) {
	var self = this;
	this.devices = devices.slice();
	this.Clear();
	//this.Sort();
	if ( Array.isArray(this.devices) && this.devices.length ) {
		this.devices.forEach(function ( device ) {
			self.Add(device);
		});
	} else {
		this.Show(false);
	}
};


/**
 * Reset and clear all items
 * This will make the component ready for a new filling.
 */
CBtList.prototype.Clear = function () {
	CScrollList.prototype.Clear.call(this);
};


/**
 * Create new item and put it in the list
 * @param {Object} Device point item label
 * @return {Node|null}
 */
CBtList.prototype.Add = function ( device ) {
	var $wrapper, $name, $icon, $connectionIcon, item, className;

	$name = element('div', {className: 'name'}, device.name || device.title || device.address);
	$icon = element('div', {className: 'icon'});
	$connectionIcon = element('div', {className: 'icon connection'});
	className = 'device';
	if ( device.paired ) { className += ' paired'; }
	if ( device.active ) { className += ' connected'; }
	$wrapper = element('div', {className: className}, [$name,$connectionIcon, $icon]);

	if ( this.isVisible !== true ) {
		this.Show(true);
	}

	setBluetoothDeviceHandlers(device);

	item = CScrollList.prototype.Add.call(this, $wrapper, {
		$body: $wrapper,
		data: device,
		onclick: (device.paired && device.active) ? forgetBtDeviceHandler: connectBluetoothDevice,
		oncontextmenu: EMULATION ? null : function () {
			return false;
		}
	});


	device.onChange = function ( property, value ) {
		// console.log(property + ': ' + value);
	};

	return item;

};

/**
 * Hook method on focus item change
 * @param {Node} item the new focused item
 */
CBtList.prototype.onFocus = function ( item ) {
	var self = this;
	if ( item ) {
		// clear delayed call
		if ( this.infoTimer ) {
			clearTimeout(this.infoTimer);
		}
		// preview and MediaBrowser itself are available
		if ( btInfoSideBar.isVisible && self.parent.isVisible ) {
			// add delay
			this.infoTimer = setTimeout(function () {
				// show info in preview block
				btInfoSideBar.info(item.data);
			}, 400);
		}

		if ( this.buttonTimer ) {
			clearTimeout(this.buttonTimer);
		}
		this.buttonTimer = setTimeout(function () {
			if ( item.data.paired ) {
				// init button panel
				SettingsPage.bpanel.Rename(SettingsPage.bpanel.AddNetworkBtn, _('Unpaire'));
				SettingsPage.bpanel.Hidden(SettingsPage.bpanel.AddNetworkBtn, false);
			} else {
				// ?
				SettingsPage.bpanel.Hidden(SettingsPage.bpanel.AddNetworkBtn, true);
			}
		}, 400);

	}

};

CBtList.prototype.Length = function () {
	var length = 0;

	this.Each(function () {
		length++;
	});

	return length;
};
