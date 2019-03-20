'use strict';

/**
 * Base class for any visual component.
 * Always has one html placeholder.
 * @class CBase
 * @constructor
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */
function CBase ( parent ) {
	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CBase';

	/**
	 * Component placeholder
	 * should be never used for append nodes inside the component methods
	 * use this.handleInner instead
	 * @type {Node}
	 */
	this.handle = null;

	/**
	 * Object owner of the component
	 * @type {CBase}
	 */
	this.parent = null;

	/**
	 * Component main body placeholder (should be the same as this.handle)
	 * can be different only in case when the given placeholder is invalid (don't have the necessary class)
	 * so the valid wrapper with this.baseClass should be created instead
	 * @type {Node}
	 */
	this.handleInner = null;

	/**
	 * CSS "display" attribute value to make the component visible
	 * to hide the default value is "none"
	 * @type {string}
	 */
	this.showAttr = 'block';

	/**
	 * CSS class name associated with the component
	 * it is checking on initialization in the placeholder
	 * if not found a wrapper is created
	 * @type {string}
	 */
	this.baseClass = '';

	/**
	 * The previous DOM element that had focus
	 * (used for focus management on show/hide operations)
	 * @type {Node}
	 */
	this.prevFocus = null;

	/**
	 * Flag to indicate the component state
	 * using for event handling and activate/deactivate hooks
	 * @type {boolean}
	 */
	this.isActive = false;

	/**
	 * Current active child element
	 * @type {CBase}
	 */
	this.activeChild = null;

	/**
	 * default visibility state
	 * @type {boolean}
	 */
	this.isVisible = true;

	// apply hierarchy
	this.SetParent(parent);

}


/**
 * Set the parent object owner of this component
 * @param {CBase} parent object owner
 */
CBase.prototype.SetParent = function ( parent ) {
	// check input
	if ( parent instanceof CBase ) {
		// store here as well
		this.parent = parent;
	}
};


/**
 * Component initialization with its placeholder.
 * Should be called once before use just after constructor invoke and all hooks preparation.
 * @param {Node} handle component placeholder (it should be an empty div element)
 */
CBase.prototype.Init = function ( handle ) {
	// input validation
	if ( handle && handle.nodeName ) {
		// global store
		this.handle = handle;

		// the given placeholder is invalid (don't have the necessary base class)
		if ( this.baseClass && handle.className.indexOf(this.baseClass) === -1 ) {
			// add wrapper
			this.handleInner = this.handle.appendChild(element('div', {className:this.baseClass}));
		} else {
			// the component body pointer
			this.handleInner = this.handle;
		}

		var self = this;
		this.handle.addEventListener('click', function(event){
			if ( typeof self.onClick === 'function' && self.onClick() === false ) {
				// prevents further propagation of the current event
				event.stopPropagation();
			}
		});

		// run callback hook
		if ( typeof this.onInit === 'function' ) {
			this.onInit();
		}
	}
};


/**
 * Makes the component active or disable it
 * process the activation/deactivation hooks for this component and its parent
 * @param {boolean} [active=true]
 */
CBase.prototype.Activate = function ( active ) {
	this.isActive = active !== false;
	if ( this.isActive ) {
		// run this component activation callback hook
		if ( typeof this.onActivate === 'function' ) {
			this.onActivate();
		}
		// has parent
		if ( this.parent ) {
			// run the previous active component deactivation (if not itself)
			if ( this.parent.activeChild && this.parent.activeChild !== this ) {
				this.parent.activeChild.Activate(false);
			}
			// set link in the parent
			this.parent.activeChild = this;
		}
	} else {
		// run this component deactivation callback hook
		if ( typeof this.onDeactivate === 'function' ) {
			this.onDeactivate();
		}
		// has parent
		if ( this.parent ) {
			// set link in the parent
			this.parent.activeChild = null;
		}
	}
};


/**
 * Manage the component visibility, global focus and exec show/hide hooks
 * @param {boolean} [visible=true] component visibility: true - visible, false - hidden
 * @param {boolean} [manageFocus=true] focus handling mode: true - set/remove focus accordingly, false - manual focus management
 * @return {boolean} status: true - operation was successful (mode changed), false - operation was skipped
 */
CBase.prototype.Show = function ( visible, manageFocus ) {
	var success = false;
	// placeholder validation
	if ( this.handle ) {
		this.isVisible = visible !== false;
		// show
		if ( this.isVisible ) {
			// prevent double invoke
			if ( this.handle.style.display !== this.showAttr ) {
				// save the previous focused element
				this.prevFocus = document.activeElement;
				// remove focus if necessary and set
				if ( manageFocus !== false && document.activeElement ) {
					document.activeElement.blur();
				}
				// show this component
				this.handle.style.display = this.showAttr;
				// set focus if necessary
				if ( manageFocus !== false ) {
					this.handle.focus();
				}
				// invoke callback hook
				if ( typeof this.onShow === 'function' ) {
					this.onShow();
				}
				success = true;
			}
		// hide
		} else {
			// prevent double invoke
			if ( this.handle.style.display !== 'none' ) {
				// remove focus if necessary and set
				if ( manageFocus !== false && document.activeElement ) {
					document.activeElement.blur();
				}
				// hide this component
				this.handle.style.display = 'none';
				// return focus to the previous element if necessary and set
				if ( manageFocus !== false && this.prevFocus ) {
					this.prevFocus.focus();
				}
				// invoke callback hook
				if ( typeof this.onHide === 'function' ) {
					this.onHide();
				}
				// deactivate this component if necessary
				if ( this.isActive ) {
					this.Activate(false);
				}
				success = true;
			}
		}
	}
	return success;
};


/**
 * Set visibility mode
 * @param {boolean} [mode=false] show/hide the component
 */
CBase.prototype.Visible = function ( mode ) {
	this.handle.style.visibility = Boolean(mode) ? 'visible' : 'hidden';
};


/**
 * Events handler entry point.
 * Should be recreated if necessary in each child object to handle parent events.
 * @type {Function}
 */
CBase.prototype.EventHandler = null;


// hooks to redefine
CBase.prototype.onInit = null;
CBase.prototype.onShow = null;
CBase.prototype.onHide = null;
CBase.prototype.onActivate = null;
CBase.prototype.onDeactivate = null;


/**
 * Method to activate a component by mouse click on it
 * @returns {boolean}
 */
CBase.prototype.onClick = function () {
	this.Activate(true);
	return true;
};
