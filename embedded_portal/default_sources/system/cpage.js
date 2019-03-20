'use strict';

/**
 * Class for main pages of the portal.
 * Each page should be created from this class.
 * @class CPage
 * @constructor
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */
function CPage ( parent ) {
	// parent constructor
	CBase.call(this, parent || null);

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CPage';

	/**
	 * the object that will become visible after this one is hidden
	 * @type {CPage|CBase}
	 */
	this.previous = null;

	/**
	 * default visibility state
	 * @type {boolean}
	 */
	this.isVisible = false;

}

// extending
CPage.prototype = Object.create(CBase.prototype);
CPage.prototype.constructor = CPage;


/**
 * Manage the page visibility
 * @param {boolean} [visible=true] component visibility: true - visible, false - hidden
 * @param {CPage|CBase} [previous=null] the page to return to on this page hiding
 */
CPage.prototype.Show = function ( visible, previous ) {
	// custom action
	if ( visible === false ) { // hide
		// turn off events
		if ( this.activeChild ) {
			this.activeChild.Activate(false);
		}
		// hide this
		CBase.prototype.Show.call(this, false, true, true);

		// go to home if not set
		window.currCPage = this.previous || window.baseCPage;
		this.previous = null;

		// if set and not itself
		if ( window.currCPage && window.currCPage !== this ) {
			// show it
			CBase.prototype.Show.call(window.currCPage, true, true, true);
		}
	} else { // show
		// if set and not itself
		this.previous = previous || null;

		if ( window.currCPage && window.currCPage !== this ) {
			if ( window.currCPage.activeChild ) {
				window.currCPage.activeChild.Activate(false);
			}
			// hide it
			CBase.prototype.Show.call(window.currCPage, false, true, true);
		}

		// show this
		CBase.prototype.Show.call(this, true, true, true);

		// set back route

		window.currCPage = this;
	}
};


/**
 * Can handle a mouse click
 */
CPage.prototype.onClick = function () {
	return false;
};


/**
 * Should be overwritten in each instance
 */
CPage.prototype.EventHandler = function () {
	// ...
};
