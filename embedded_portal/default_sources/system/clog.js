'use strict';

var CLog = function(parent, options){
	var self = this;
	CBase.call(this, parent || null);
	this.newest = false;
	CLog.parameters.forEach(function(option){
		if (options[option] !== undefined) {
			self[option] = options[option];
		}
	});
	this.bind(options.events || {});
	this.Init(element('div', {className: 'clog'}, this.$log = element('ul', {})));
};

CLog.parameters = ['time', 'autofocus', 'parentNode', 'events', 'defaultType', 'newest', 'isVisible'];

// extending
CLog.prototype = Object.create(CBase.prototype);
CLog.prototype.constructor = CLog;

CLog.prototype.onInit = function(){
	elchild(this.parentNode, this.handle);
};

CLog.prototype.onShow = function(){
	if (this.autofocus === true && this.$log.childElementCount !== 0){
		this.$log.lastElementChild.focus();
	}
	this.trigger('onShow');
};

CLog.prototype.onHide = function(){
	this.trigger('onHide');
};

CLog.prototype.Add = function( message, type){
	if (this.newest === false || (this.newest === true && this._lastMessage !== message)){
		this._lastMessage = message;
		var currTime = new Date(),
			$data = [element('span', {className: 'message'}, message)];
		if (this.time === true) {
			$data.push(element('span', {className: 'time'}, ('0' + currTime.getHours()).slice(-2) + ':' + ('0' + currTime.getMinutes()).slice(-2) + ':' + ('0' + currTime.getSeconds()).slice(-2)));
		}
		elchild(this.$log,
			element('li', {className: type || this.defaultType, tabIndex: '1'},	$data)
		);
		if (this.autofocus === true) {
			this.$log.lastElementChild.focus();
		}
		this.trigger('onAdd');
	}
};

Events.inject(CLog);
