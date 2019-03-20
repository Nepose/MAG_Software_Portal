/**
 * Component: Wi-Fi list
 * Wi-Fi list with navigation
 * @author Denys Vasylyev
 * @extends CScrollList
 */

'use strict';

/**
 * @class CWiFiList
 * @constructor
 */
function CWiFiList ( parent ) {
	// parent constructor
	CScrollList.call(this, parent);

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CWiFiList';

	/**
	 * Access points
	 * @type {Array}
	 */
	this.accessPoints = null;

	this.classNames = ['closed', 'open'];
}

// extending
CWiFiList.prototype = Object.create(CScrollList.prototype);
CWiFiList.prototype.constructor = CWiFiList;

/**
 * Set access points data
 * @param {[Object]} accessPoints
 */
CWiFiList.prototype.SetData = function ( accessPoints ) {
	var self = this;

	this.accessPoints = accessPoints.slice();
	this.Clear();
	this.Sort();
	if ( Array.isArray(this.accessPoints) && this.accessPoints.length ) {
		this.accessPoints.forEach(function ( accessPoint ) {
			self.Add(accessPoint);
		});
	}
};

/**
 * Reset and clear all items
 * This will make the component ready for a new filling.
 */
CWiFiList.prototype.Clear = function () {
	CScrollList.prototype.Clear.call(this);
};

/**
 * Sorts the access points
 */
CWiFiList.prototype.Sort = function () {
	this.accessPoints.sort(function ( a, b ) {
		return b.signalInfo - a.signalInfo;
	});
};

/**
 * Create new item and put it in the list
 * @param {Object} Access point item label
 * @return {Node|null}
 */
CWiFiList.prototype.Add = function ( accessPoint ) {
	var hidden = false,
		$status, $ssid, $auth, $enc, $priority, $icon, $wrapper, item, $empty;
	if ( accessPoint !== undefined && accessPoint.ssid ) {
		$auth = accessPoint.auth.toLowerCase();
		$enc = accessPoint.enc.toLowerCase();
		if ( ($auth === 'none' && $enc === 'none') || ($auth === 'open' && $enc === 'none') ) {
			accessPoint.state = 1;
		} else {
			accessPoint.state = 0;
		}
		$status = element('div', {className: 'status'});
		$ssid = element('div', {className: 'ssid'}, accessPoint.ssid);
		$icon = element('div', {className: 'icon'});
		$priority = element('div', {className: 'priority'}, [
			element('div', {className: 'full'}),
			$empty = element('div', {className: 'empty'})
		]);
		$wrapper = element('div', {className: this.classNames[accessPoint.state]}, [$status, $ssid, $icon, $priority]);

		if ( accessPoint.connected && gSTB.GetWifiLinkStatus() ) {
			$wrapper.classList.toggle('connected');
			this.connectedItem = $wrapper;
		}

		if ( this.isVisible !== true ) {
			this.Show(true);
		}

		item = CScrollList.prototype.Add.call(this, $wrapper, {
			$body: $wrapper,
			hidden: hidden,
			data: accessPoint,
			onclick: function () {
				wiFiAuthenticationLoad(accessPoint);
			},
			oncontextmenu: EMULATION ? null : function () {
				return false;
			}
		});

		if ( parseInt(accessPoint.signalInfo) <= -80 ) {
			$empty.style.height = '80%';
		} else if ( parseInt(accessPoint.signalInfo) <= -70 ) {
			$empty.style.height = '60%';
		} else if ( parseInt(accessPoint.signalInfo) <= -60 ) {
			$empty.style.height = '40%';
		} else if ( parseInt(accessPoint.signalInfo) <= -50 ) {
			$empty.style.height = '20%';
		} else {
			$empty.style.height = '0%';
		}

		item.$priority = $empty;
	}

	return item;
};

/**
 * Hook method on focus item change
 * @param {Node} item the new focused item
 * @param {Node} [previous] the old focused item
 */
CWiFiList.prototype.onFocus = function ( item ) {
	var self = this;

	if ( item ) {
		// clear delayed call
		if ( this.timer ) {
			clearTimeout(this.timer);
		}
		// preview and MediaBrowser itself are available
		if ( wiFiInfoSideBar.isVisible && self.parent.isVisible ) {
			// add delay
			this.timer = setTimeout(function () {
				// show info in preview block
				wiFiInfoSideBar.info(item.data);
			}, 400);
		}
		if ( item.data.connected ) {
			SettingsPage.bpanel.Hidden(SettingsPage.bpanel.RemoveNetworkBtn, false);
		} else {
			SettingsPage.bpanel.Hidden(SettingsPage.bpanel.RemoveNetworkBtn, true);
		}
	}
};

CWiFiList.prototype.Length = function () {
	var length = 0;

	this.Each(function () {
		length++;
	});

	return length;
};
