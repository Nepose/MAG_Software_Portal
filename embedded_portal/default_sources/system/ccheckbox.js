'use strict';

/**
 * Class for checkboxes in the portal
 * @param {CBase} parent     Object owner of the component
 * @param {Object} parameters Initialization parameters
 * @class CCheckBox
 * @constructor
 * @author Igor Kopanev
 * @example checkbox = new CCheckBox(currCPage, {
 * 		element: element // {Node} If checkbox already exist on the page you can init component from him.
 * 		parentNode: parent // {Node} parent node for checkbox
 * 		attributes: attributes // {Object} attributes that are applied to a check
 * 		checked: true // {boolean} shows that the box is checked or not
 * 		onchange: onchange // {Function} onchange event function
 * });
 * @throw if parentNode of element parameters is not specified
 */
function CCheckBox ( parent, parameters ){
	var parentNode,
		_default = !!parameters.checked,
		self = this;
	CBase.call(this, parent || null);
	this.parameters = parameters || {};
	this.parameters.attributes = parameters.attributes || {};
	this.name = parameters.name || 'input';
	this.type = this.tagName = 'checkbox';
	this.style = parameters.style || '';
	this.events = parameters.events || {};
	// if parentNode not specified get the checkbox parentNode
	if ((parentNode = parameters.parent) === undefined){
		// if checkbox not specified to throw exception
		if (parameters.element === undefined){
			throw('parentNode or element parameter must be specified');
		}
		parentNode = parameters.element.parentNode;
	}

	this.bind(this.events);

	this.IsChanged = function(){
		return _default !== self.IsChecked();
	};

	this.Init(parentNode);
}

// extending
CCheckBox.prototype = Object.create(CBase.prototype);
CCheckBox.prototype.constructor = CCheckBox;

/**
 * Default values for element initialization
 * @type {Object}
 */
CCheckBox.DefaultAttributes = {
	checkbox: {
		type: 'checkbox',
		className: 'ccheck-box-input'
	},
	label: {
		className: 'ccheck-box-label'
	},
	wrapper: {
		className: 'ccheck-box-wrapper',
		tabIndex: '1'
	}
};


/**
 * Callback for CBase.Init function
 * Checkbox initialize
 */
CCheckBox.prototype.onInit = function(){
	if (this.parameters.element !== undefined && this.parameters.element.nodeName === 'INPUT' && this.parameters.element.type === 'checkbox'){
		this.parameters.element.parentNode.removeChild(this.parameters.element);
		this.checkbox = this.parameters.element;
		elattr(this.checkbox, extend(CCheckBox.DefaultAttributes.checkbox, this.parameters.attributes.checkbox, true));
	}
	// if checkbox not specified in parameters or specified wrong then generate it
	if (this.checkbox === undefined){
		this.checkbox = this.generateCheckbox();
	}
	this.wrapper = this.generateWrapper(this.checkbox); // create wrapper
	this.wrapper.className += ' ' + this.style;
	if (this.parameters.checked === true) {
		this.Check(true, true);
	} 	// check checkbox if needed
	elchild(this.handleInner, this.wrapper);
};

/**
 * Generate input[type=checkbox] element with necessary parameters
 * @returns {Node}
 */
CCheckBox.prototype.generateCheckbox = function() {
	var self = this,
		attrs = extend(CCheckBox.DefaultAttributes.checkbox, this.parameters.attributes.checkbox, true);
	if (attrs.id === undefined) {
		attrs.id = CCheckBox.GenerateId();
	}
	attrs.onchange = function(){
		self.checked = this.checked;
		self.trigger('onChange', arguments);
	};
	attrs.onclick = function() {
		self.Check(!self.IsChecked());
	};
	return element('input', attrs);
};

/**
 * Generate wrapper for checkbox and label
 * @param checkbox {Node} current checkbox
 * @param [label] {Node} label for this checkbox
 * @returns {Node} new wrapper
 */
CCheckBox.prototype.generateWrapper = function( checkbox, label ){
	var self = this;
	if (this.checkbox === undefined){
		throw('Checkbox must be created before label');
	}
	this.label = element('label', extend({htmlFor: this.checkbox.id}, CCheckBox.DefaultAttributes.label));
	this.label.onclick = function(){self.Check(!self.IsChecked());};
	return element('div', CCheckBox.DefaultAttributes.wrapper, [checkbox, label || this.label]);
};

/**
 * Generate random id for checkbox
 * @return {string}
 */
CCheckBox.GenerateId = function(){
	return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
};

/**
 * Check or uncheck the checkbox
 * @param {boolean} checked true - checked, false - unchecked
 * @param {boolean} [block_event] true - not trigger onchange event
 */
CCheckBox.prototype.Check = function(checked, block_event){
	this.checked = this.checkbox.checked = checked === true;
	if (block_event !== true) {
		this.trigger('onChange');
	}
};
/**
 * Return checkbox state
 * @returns {boolean}
 */
CCheckBox.prototype.IsChecked = function(){
	return this.checkbox.checked === true;
};

CCheckBox.prototype.EventHandler = function(event){
	switch (event.code){
		case KEYS.LEFT:
		case KEYS.RIGHT:
			this.Check(event.code === KEYS.LEFT);
			event.stopped = true;
			break;
		default: break;
	}
};

CCheckBox.prototype.focus = function(){
	this.wrapper.focus();
};

Events.inject(CCheckBox);
