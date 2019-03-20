'use strict';

/**
 * Class for breadcrumb with images.
 * @class CBreadCrumb
 * @constructor
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */
function CBreadCrumb ( parent ) {
	// parent constructor
	CBase.call(this, parent);

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CBreadCrumb';

	/**
	 * CSS class name associated with the component
	 * @type {string}
	 */
	this.baseClass = 'cbcrumb-main';

	/**
	 * directory with icons
	 * depends on screen resolution
	 * @type {string}
	 */
	this.path = '';

	/**
	 * Amount of left items before the ...
	 * @type {number}
	 */
	this.leftItems = 3;

	/**
	 * Amount of right items after the ...
	 * @type {number}
	 */
	this.rightItems = 2;
}

// extending
CBreadCrumb.prototype = Object.create(CBase.prototype);
CBreadCrumb.prototype.constructor = CBreadCrumb;


/**
 * Component initialization with image path set.
 * @param {string} path image path dependant on resolution
 * @param {Node} [handle] component placeholder
 * @param {number} [leftItems] amount of left items before the ...
 * @param {number} [rightItems] amount of right items after the ...
 */
CBreadCrumb.prototype.Init = function ( path, handle, leftItems, rightItems ) {
	// global vars
	this.path = path;

	// parent call init with placeholder
	CBase.prototype.Init.call(this, handle);

	this.dom = {};
	// add to component container
	elchild(this.handleInner, [
		this.dom.list = element('div', {className: 'cbcrumb-list'}),
		this.dom.name = element('div', {className: 'cbcrumb-name'})
	]);

	this.leftItems = leftItems || this.leftItems;
	this.rightItems = rightItems || this.rightItems;
};


/**
 * Set optional auto-hide title to the right from the root icon
 * @param {string} text label to show
 */
CBreadCrumb.prototype.SetName = function ( text ) {
	elclear(this.dom.name);
	elchild(this.dom.name, element('div', {innerHTML: text, className: 'cbcrumb-name-text'}));
	// show or hide title
	this.DrawName();
};


/**
 * Set title visibility
 */
CBreadCrumb.prototype.DrawName = function () {
	// show or hide title
	this.dom.name.style.display = this.dom.list.children.length === 1 ? 'table-cell' : 'none';
};


/**
 * Append a new button
 * @param {string} path
 * @param {string} [icon] file of the button icon
 * @param {string} [text] button title
 * @param {string} [iid] item id
 * @returns {Node}
 */
CBreadCrumb.prototype.Push = function ( path, icon, text, iid ) {
	var last = this.dom.list.lastChild;

	if ( last ) {
		last.className = 'cbcrumb-item';
	}

	// build item
	var item = element('div', {className: 'cbcrumb-item active', onclick: null, path: path}, [
		icon ? element('img', {className: 'cbcrumb-icon', onclick: null, src: this.path + icon}) : null,
		text ? element('div', {className: 'cbcrumb-text', onclick: null}, text) : null
	]);

	// set id
	if ( iid ) {
		item.iid = iid;
	}

	// add divider
	if ( this.dom.list.children.length === this.leftItems ) {
		elchild(this.dom.list, element('div', {className: 'cbcrumb-item divider'}, '. . .'));
	}
	// add to component container
	elchild(this.dom.list, item);
	// show ... and hide item
	if ( this.dom.list.children.length > this.leftItems + this.rightItems + 1 ) {
		this.dom.list.children[this.leftItems].style.display = 'table-cell';
		this.dom.list.children[this.dom.list.children.length - this.rightItems - 1].style.display = 'none';
	}

	// show or hide title
	this.DrawName();

	return item;
};


/**
 * Extracts the last item
 * @return {Node}
 */
CBreadCrumb.prototype.Pop = function () {
	var item = this.dom.list.lastChild;
	if ( item ) {
		this.dom.list.removeChild(item);

		// remove divider
		if ( this.dom.list.children.length === this.leftItems + 1 ) {
			this.dom.list.removeChild(this.dom.list.lastChild);
		} else if ( this.dom.list.children.length > this.leftItems + this.rightItems ) {
			this.dom.list.children[this.dom.list.children.length - this.rightItems].style.display = 'table-cell';
		}
		if ( this.dom.list.children.length === this.leftItems + this.rightItems + 1 ) {
			this.dom.list.children[this.leftItems].style.display = 'none';
		}

		if ( this.dom.list.lastChild ) {
			this.dom.list.lastChild.className = 'cbcrumb-item active';
		}

		// show or hide title
		this.DrawName();
	}
	return item;
};


/**
 * Gets the current item
 * @return {Node}
 */
CBreadCrumb.prototype.Tip = function () {
	return this.dom.list.lastChild;
};


/**
 * Clears all the items
 */
CBreadCrumb.prototype.Reset = function () {
	elclear(this.dom.list);
	// show or hide title
	this.DrawName();
};


/**
 * Can handle a mouse click
 */
CBreadCrumb.prototype.onClick = function () {
	return false;
};
