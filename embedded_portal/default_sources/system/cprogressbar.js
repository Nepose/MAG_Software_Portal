'use strict';

/**
 * Progressbar component
 * @class CProgressBar
 * @param {CBase} parent
 * @param {HTMLElement} parentNode Элемент в который будет вставлен компонент
 * @constructor
 */
var CProgressBar = function (parent, parentNode) {
	CBase.call(this, parent || null);
	if (parentNode === undefined) {
		parentNode = element('div');
	}
	elchild(parentNode, this.$bar = element('div', {className: 'cprogressbar'},
		element('div', {className: 'progressbar_bg'}, [
			this.$line = element('div', {className: 'progressbar_line'}),
			this.$digit = element('div', {className: 'progressbar_digit'}, '0 %')
		])
	));
	this.Init(parentNode);
};

// extending
CProgressBar.prototype = Object.create(CBase.prototype);
CProgressBar.prototype.constructor = CProgressBar;

CProgressBar.prototype.SetProgress = function (percent) {
	this.$line.style.width = percent + '%';
	this.$digit.innerHTML = percent + '%';
};
