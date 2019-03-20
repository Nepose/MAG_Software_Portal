/**
 * @author Stanislav Kalashnik <sk@infomir.eu> Igor Zaporozhets <deadbyelpy@gmail.com>
 * @license GNU GENERAL PUBLIC LICENSE Version 3
 */

'use strict';


/**
 * Virtual scroll bar implementation.
 * Based on scroll bar from stb framework. but event model, and scroll bar type have been removed
 * @link https://github.com/DarkPark/stb/blob/master/app/js/ui/scroll.bar.js
 *
 * @constructor
 *
 * @param {Object} [config={}] init parameters (all inherited from the parent)
 * @param {number} [config.value=0] initial thumb position
 * @param {number} [config.realSize=100] actual scroll size
 * @param {number} [config.viewSize=10] visible area size
 *
 * @example
 * var scrollBar = new VScrollBar({
 *         viewSize: 5,
 *         realSize: 25,
 *         value: 4
 *     });
 */
function VScrollBar ( config ) {

	/**
	 * DOM outer handle.
	 *
	 * @type {Element}
	 */
	this.$node = null;

	/**
	 * DOM inner handle.
	 * In simple cases is the same as $node.
	 *
	 * @type {Element}
	 */
	this.$body = null;

	/**
	 * Visible area size.
	 *
	 * @type {number}
	 */
	this.viewSize = 10;

	/**
	 * Scroll area actual height or width (if scroll is horizontal).
	 *
	 * @type {number}
	 */
	this.realSize = 100;

	/**
	 * Scroll thumb position.
	 *
	 * @type {number}
	 */
	this.value = 0;

	/**
	 * Geometry of the scroll thumb element.
	 *
	 * @type {ClientRect}
	 */
	this.thumbRect = null;

	/**
	 * Geometry of the scroll track element.
	 *
	 * @type {ClientRect}
	 */
	this.trackRect = null;


	// sanitize
	config = config || {};

	// outer handle
	if ( config.$node !== undefined ) {
		// apply
		this.$node = config.$node;
	} else {
		// empty div in case nothing is given
		this.$node = document.createElement('div');
	}

	// inner handle
	if ( config.$body !== undefined ) {
		// apply
		this.$body = config.$body;
	} else {
		// inner and outer handlers are identical
		this.$body = this.$node.appendChild(document.createElement('div'));
	}

	// correct CSS class names
	this.$node.classList.add('scrollBar');
	this.$body.classList.add('thumb');

	// component setup
	this.init(config);
}


/**
 * Init or re-init realSize/viewSize/value parameters.
 *
 * @param {Object} config init parameters (subset of constructor config params)
 */
VScrollBar.prototype.init = function ( config ) {
	config = config || {};

	if ( DEBUG ) {
		if ( arguments.length !== 1 ) { throw 'wrong arguments number'; }
		if ( typeof config !== 'object' ) { throw 'wrong config type'; }
	}

	// set actual scroll size
	if ( config.realSize !== undefined ) {
		if ( DEBUG ) {
			if ( Number(config.realSize) !== config.realSize ) { throw 'config.realSize value must be a number'; }
		}
		// apply
		this.realSize = config.realSize;
	}

	// set visible area size
	if ( config.viewSize !== undefined ) {
		if ( DEBUG ) {
			if ( Number(config.viewSize) !== config.viewSize ) { throw 'config.viewSize value must be a number'; }
			if ( config.viewSize <= 0 ) { throw 'config.viewSize value must be greater than 0'; }
		}
		// apply
		this.viewSize = config.viewSize;
	}

	// show or hide thumb
	if ( this.viewSize >= this.realSize ) {
		this.$body.classList.add('hidden');
	} else {
		this.$body.classList.remove('hidden');
	}

	// set thumb position
	if ( config.value !== undefined ) {
		// apply
		this.scrollTo(config.value);
	}

	// set thumb size
	this.$body.style.height = (this.viewSize / this.realSize * 100) + '%';

	// geometry
	this.thumbRect = this.$body.getBoundingClientRect();
	this.trackRect = this.$node.getBoundingClientRect();
};


/**
 * Set position of the given value.
 * Does nothing in case when scroll is in the end and passed value is more than scroll bar length.
 *
 * @param {number} value new value to set
 * @return {boolean} operation result
 *
 * @fires module:stb/ui/scroll.bar~VScrollBar#done
 * @fires module:stb/ui/scroll.bar~VScrollBar#change
 */
VScrollBar.prototype.scrollTo = function ( value ) {
	if ( DEBUG ) {
		if ( arguments.length !== 1 ) { throw 'wrong arguments number'; }
		if ( Number(value) !== value ) { throw 'value must be a number'; }
		if ( this.realSize > this.viewSize && value > this.realSize - this.viewSize ) { throw 'value is greater than this.realSize-this.viewSize'; }
		if ( value < 0 ) { throw 'value is less then 0'; }
	}

	// value has changed
	if ( this.value !== value ) {
		// track and thumb geometry was not set
		if ( this.thumbRect.height === 0 || this.thumbRect.width === 0 ) {
			// apply
			this.trackRect = this.$node.getBoundingClientRect();
			this.thumbRect = this.$body.getBoundingClientRect();
		}

		// set scroll bar width
		this.$body.style.marginTop = ((this.trackRect.height - this.thumbRect.height) * value / (this.realSize - this.viewSize)) + 'px';

		// is it the end?
		if ( value >= this.realSize ) {
			value = this.realSize;
		}

		// set new value
		this.value = value;

		return true;
	}

	// nothing was done
	return false;
};
