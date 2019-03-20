/**
 * Modal windows of different types
 *     CModal
 *     CModalBox
 *     CModalHint
 *     CModalAlert
 *     CModalConfirm
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

'use strict';

// default icon images path
var CMODAL_IMG_PATH = window.configuration && configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/';


/**
 * Class for modal windows and messages.
 * Default use case:
 *   - create
 *   - set title/content/footer
 *   - init (after the DOM is ready)
 *   - show
 *   - hide/destroy
 * @class CModal
 * @constructor
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */
function CModal ( parent ) {
	// parent constructor
	CPage.call(this, parent);

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModal';

	/**
	 * CSS class name associated with the component
	 * @type {string}
	 */
	this.baseClass = 'cmodal-main';

	/**
	 * CSS "display" attribute value to make the component visible
	 * to hide the default value is "none"
	 * @type {string}
	 */
	this.showAttr = 'table';

	this.focusList = [];
	this.focusPos = 0;
}

// extending
CModal.prototype = Object.create(CPage.prototype);
CModal.prototype.constructor = CModal;


/**
 * Prepare html and all placeholders
 * @param {Node|string} body window content
 */
CModal.prototype.Init = function ( body ) {
	// parent call init with placeholder
	CPage.prototype.Init.call(this,
		element('div', {className: this.baseClass},
			element('div', {className:'cmodal-cell'},
				body
	)));
	// get the node to append to
	var owner = (this.parent && this.parent.handle && this.parent.handle.nodeName ? this.parent.handle : document.body);
	// get the upper parent if exist in order to prevent nesting
	if ( this.parent instanceof CModal && this.parent.parent ) {
		owner = this.parent.parent.handle;
	}
	// fill
	owner.appendChild(this.handle);
};


/**
 * Destroy the window and free resources
 */
CModal.prototype.Free = function () {
	// global or local clearing
	if ( this.handle && this.handle.parentNode ) {
		this.handle.parentNode.removeChild(this.handle);
	}
	elclear(this.handle);
};


/**
 * Manage the window visibility
 * also enable/disable parent window event handling
 * @param {boolean} [visible=true] true - visible; false - hidden
 * @param {boolean} [manageFocus=true] focus handling mode: true - set/remove focus accordingly, false - manual focus management
 */
CModal.prototype.Show = function ( visible, manageFocus ) {
	// parent call
	CBase.prototype.Show.call(this, visible, manageFocus !== false);

	if ( visible === false ) {  // hide
		window.currCPage = this.parent;
	} else {  // show
		window.currCPage = this;
	}
};


/**
 * Move focus to the previous element from the focusList set
 */
CModal.prototype.FocusPrev = function ( event, manageVK ) {
	if ( this.focusList.length > 0 ) {
		// cycling the index
		if ( --this.focusPos < 0 ) {
			this.focusPos = this.focusList.length-1;
		}
		// get the next html element in the list
		var el = this.focusList[this.focusPos];
		if ( manageVK !== false ) {
			gSTB.HideVirtualKeyboard();
		}
		// set focus
		el.focus();
		// skip looping select options elements
		if ( event && el.tagName === 'INPUT' && el.type === 'text' ) {
			event.preventDefault();
			if ( manageVK !== false ) {
				gSTB.ShowVirtualKeyboard();
			}
		}
	}
};


/**
 * Move focus to the next element from the focusList set
 */
CModal.prototype.FocusNext = function ( event, manageVK ) {
	if ( this.focusList.length > 0 ) {
		// cycling the index
		if ( ++this.focusPos >= this.focusList.length ) {
			this.focusPos = 0;
		}
		// get the next html element in the list
		var el = this.focusList[this.focusPos];
		if ( manageVK !== false ) {
			gSTB.HideVirtualKeyboard();
		}
		// set focus
		el.focus();
		// skip looping select options elements
		if ( event && el.tagName === 'INPUT' && el.type === 'text' ) {
			event.preventDefault();
			if ( manageVK !== false ) {
				gSTB.ShowVirtualKeyboard();
			}
		}
	}
};


///////////////////////////////////////////////////////////////////////////////


/**
 * Show small modal info panel which automatically hides in the given time
 * @class CModalBox
 * @constructor
 * @example
 *   var mb = new CModalBox();
 */
function CModalBox ( parent ) {
	// parent constructor
	CModal.call(this, parent);

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModalBox';

	/**
	 * html element for window title
	 * @type {Node}
	 */
	this.header = element('div', {className:'cmodal-header'});

	/**
	 * html element for window main content
	 * @type {Node}
	 */
	this.content = element('div', {className:'cmodal-content'});

	/**
	 * html element for window bottom panel
	 * @type {Node}
	 */
	this.footer = element('div', {className:'cmodal-footer'});
}

// extending
CModalBox.prototype = Object.create(CModal.prototype);
CModalBox.prototype.constructor = CModalBox;


/**
 * Internal method to update one of the placeholders
 * makes the inserted node visible
 * @param {Node|Element|HTMLElement} place placeholder
 * @param {Node|Element|HTMLElement|Array|string} data some data to set
 * @return {Node} updated placeholder
 */
CModalBox.prototype.SetData = function ( place, data ) {
	// clear
	elclear(place);
	// and append
	if ( data instanceof Node || Array.isArray(data) ) {
		elchild(place, data);
	} else {
		// simple string
		place.innerHTML = data;
	}
	// make sure it visible
	if ( data && data.nodeName ) {
		data.style.display = 'block';
	}
	// show if there is some data
	place.style.display = data ? 'block' : 'none';
	return place;
};


/**
 * Set window title (alias for SetData)
 * @param {Node|Array|string} [data] some data to set
 * @return {Node} updated placeholder
 */
CModalBox.prototype.SetHeader  = function ( data ) { return this.SetData(this.header, data || ''); };


/**
 * Set window body (alias for SetData)
 * @param {Node|Array|string} [data] some data to set
 * @return {Node} updated placeholder
 */
CModalBox.prototype.SetContent = function ( data ) { return this.SetData(this.content, data || ''); };


/**
 * Set window footer (alias for SetData)
 * @param {Node|Array|string} [data] some data to set
 * @return {Node} updated placeholder
 */
CModalBox.prototype.SetFooter  = function ( data ) { return this.SetData(this.footer, data || ''); };


/**
 * Prepare html and all placeholders
 */
CModalBox.prototype.Init = function ( ) {
	// parent call init with placeholder
	CModal.prototype.Init.call(this,
		element('div', {className:'cmodal-body'}, [
			this.header,
			this.content,
			this.footer
		]
	));
};


///////////////////////////////////////////////////////////////////////////////


/**
 * Show small modal info panel which automatically hides in the given time
 * @param {CPage|CBase} [parent] object owner (document.body if not set)
 * @param {string} data info text
 * @param {Number|boolean} time milliseconds before hiding (not set - manual hide)
 * @param {boolean} [isForced=false] true do not allow to close this hint till it auto hide
 * @class CModalHint
 * @constructor
 * @example
 *   new CModalHint(CurrentPage, 'some test short info');
 */
function CModalHint ( parent, data, time, isForced ) {
	// check input
	if ( data ) {
		// parent constructor
		CModalBox.call(this, parent);

		/**
		 * The component inner name
		 * @type {string}
		 */
		this.name = 'CModalHint';

		// for limited scopes
		var self = this;

		// filling
		this.SetHeader();
		this.SetContent(data);
		this.SetFooter();

		// free resources on hide
		this.onHide = function(){
			self.Free();
		};

		// hide on mouse click
		this.onClick = function() {
			self.Show(false);
		};

		// build and display
		this.Init();
		this.Show(true);

		// allow to close by user
		if ( isForced !== true ) {
			// forward events to button panel
			this.EventHandler = function ( event ) {
				// hide
				self.Show(false);
				// reset autohide if set
				if ( self.timer ) {
					clearTimeout(self.timer);
				}
				event.preventDefault();
			};
		}

		if ( time ) {
			// hide in some time
			this.timer = setTimeout(function(){
				self.Show(false);
			}, time || 5000);
		}
	}
}

// extending
CModalHint.prototype = Object.create(CModalBox.prototype);
CModalHint.prototype.constructor = CModalHint;


///////////////////////////////////////////////////////////////////////////////


/**
 * Show modal message box with single button Exit
 * @param {CPage|CBase} [parent] object owner (document.body if not set)
 * @param {string} title modal message box caption
 * @param {string} data modal message box text
 * @param {string} btnExitTitle exit button caption
 * @param {Function} [btnExitClick] callback on exit button click
 * @class CModalAlert
 * @constructor
 * @example
 *   new CModalAlert(CurrentPage, 'Some title', 'Some long or short message text', 'Close', function(){alert('exit')});
 */
function CModalAlert ( parent, title, data, btnExitTitle, btnExitClick ) {
	// check input
	if ( data ) {
		// parent constructor
		CModalBox.call(this, parent);

		/**
		 * The component inner name
		 * @type {string}
		 */
		this.name = 'CModalAlert';

		// for limited scopes
		var self = this;

		this.bpanel = new CButtonPanel();
		this.bpanel.Init(CMODAL_IMG_PATH);
		this.bpanel.btnExit =  this.bpanel.Add(KEYS.EXIT, 'exit.png', btnExitTitle || '', function(){
			if ( typeof btnExitClick === 'function' ) {
				btnExitClick.call(self);
			}
			// hide and destroy
			self.Show(false);
		});

		// filling
		this.SetHeader(title);
		this.SetContent(data);
		this.SetFooter(this.bpanel.handle);

		// free resources on hide
		this.onHide = function(){
			elclear(self.bpanel.handle);
			delete self.bpanel;
			self.Free();
		};

		// forward events to button panel
		this.EventHandler = function ( e ) {
			if ( !eventPrepare(e, true, this.name) ) {
				return;
			}

			self.bpanel.EventHandler(e);
		};

		// build and display
		this.Init();
		this.Show(true);
	}
}

// extending
CModalAlert.prototype = Object.create(CModalBox.prototype);
CModalAlert.prototype.constructor = CModalAlert;


///////////////////////////////////////////////////////////////////////////////


/**
 * Show modal message box with single button Exit
 * @param {CPage|CBase} parent object owner (document.body if not set)
 * @param {string} title modal message box caption
 * @param {string} data modal message box text
 * @param {string} btnExitTitle exit button caption
 * @param {Function} btnExitClick callback on exit button click
 * @param {string} btnOKTitle ok button caption
 * @param {Function} btnOKClick callback on ok button click
 * @class CModalConfirm
 * @constructor
 * @example
 *   new CModalConfirm(CurrentPage, 'Some title', 'Some long or short message text', 'Close', function(){alert('exit')}, 'Ok', function(){alert('f2');});
 */
function CModalConfirm ( parent, title, data, btnExitTitle, btnExitClick, btnOKTitle, btnOKClick ) {
	// parent constructor
	CModalAlert.call(this, parent, title, data, btnExitTitle, btnExitClick);

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModalConfirm';

	// for limited scopes
	var self = this;

	// additional button
	this.bpanel.Add(KEYS.OK, 'ok.png', btnOKTitle, function(){
		// hide and destroy
		self.Show(false);

		if ( typeof btnOKClick === 'function' ) {
			btnOKClick.call(self);
			// prevent double invoke
			btnOKClick = null;
		}
	});
}

// extending
CModalConfirm.prototype = Object.create(CModalAlert.prototype);
CModalConfirm.prototype.constructor = CModalConfirm;
