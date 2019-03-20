'use strict';

function CAutocomplete ( parent, parameters ){
	var self = this;
	this.attributes = {
		wrapper: {
			className: 'cautocomplete-box'
		},
		row: {
			className: 'row',
			onmouseover: function(){
				self.SetActive(this);
			},
			onclick: function(){
				self.Abort();
				self.trigger('onEnter', {text: self.GetValue(), type: self.GetType()});
				self.Clear();
			},
			ico: {
				className: 'ico'
			},
			hint: {
				className: 'hint'
			},
			text: {
				className: 'text'
			}
		}
	};
	CBase.call(this, parent || null, parameters);
	this.name = 'CAutocomplete';
	this.active = null;
	this.events = {};
	this.isVisible = false;
	CAutocomplete.parameters.forEach(function(name){
		if (parameters[name] !== undefined) {
			self[name] = parameters[name];
		}
	});

	this.bind(this.events);

	this.base = this.base || this.input;
	this.size = this.size || 0;
	this.Init( element('div', this.attributes.wrapper) );
	this.buffer = {};

	this.input.oninput =  (function(oninput){
		return function(event){
			self.Show(false, false);
			clearTimeout(self.input_timer);
			if (self.input.value !== self.GetDefault()){
				self.buffer.data = self.input.value;
				self.input_timer = setTimeout(function(){
					self.RefreshData(self.input.value, function(){
						this.Show(true, false);
						this.RefreshUi();
					});
				}, 600);
			}
			if (typeof oninput === 'function') {
				oninput(event);
			}
		};
	})(this.input.oninput);


}

CAutocomplete.parameters = ['input', 'base', 'size', 'data', 'url', 'events', 'titleField', 'valueField', 'typeField', 'hintField'];

// extending
CAutocomplete.prototype = Object.create(CBase.prototype);
CAutocomplete.prototype.constructor = CAutocomplete;

CAutocomplete.prototype.onInit = function (){
	elchild(document.body, this.handle);
};

CAutocomplete.prototype.UpdateGeometry = function (){
	var inputRect = this.base.getBoundingClientRect();
	this.handle.style.top = (inputRect.top + inputRect.height) + 'px';
	this.handle.style.left = inputRect.left + 'px';
	this.handle.style.width = inputRect.width + 'px';
};

CAutocomplete.prototype.RefreshUi = function ( data ){
	var i, size, row;
	if (this.handle.style.width === ''){
		this.UpdateGeometry();
	}
	data = data || this._data;
	elclear(this.handle);
	size = this.size > data.length ? data.length : this.size;
	if (size > 0){
		for (i = 0; i < size; i++){
			row = this.AddRow(data[i]);
		}
		this.SetActive(this.buffer.nextSibling = this.handle.firstElementChild);
		this.buffer.previousSibling = this.handle.lastElementChild;
	}else{
		this.Show(false);
	}
};

CAutocomplete.prototype.RefreshData = function (data, callback ) {
	var url, self = this;
	if (data === '') {
		this.Show(false, false);
		return;
	}
	this.buffer.data = data;
	url = this.url ? this.url + data : data;
	if (url){
		this.xhr = ajax('GET', url, function(res, status){
			if (status === 200){
				if (typeof self.data === 'function'){
					self._data = self.data.call(this, res);
				}else{
					self._data = res[self.data];
				}
				callback.call(self, res);
				self.trigger('onDataLoad', data);
			} else {
				self.Show(false);
			}
		});
	}
};



CAutocomplete.prototype.GetTitle = function ( data ) {
	data = data || this.active.data;
	if (this.active === this.buffer) {
		return data;
	}
	return this.titleField ? data[this.titleField] : this.active.data;
};

CAutocomplete.prototype.GetValue = function ( data ) {
	data = data || this.active.data;
	if (this.active === this.buffer) {
		return data;
	}
	data = this.valueField ? data[this.valueField] : this.GetTitle();
	data = data.replace(/<\/?b>/g,'');
	return data;
};

CAutocomplete.prototype.GetType = function ( data ) {
	data = data || this.active.data;
	return data[this.typeField] ? data[this.typeField] : 'search';
};

CAutocomplete.prototype.GetHint = function ( data ) {
	data = data || this.active.data;
	return this.hintField ? data[this.hintField] : '';
};

CAutocomplete.prototype.GetDefault = function () {
	return this.buffer.data;
};

CAutocomplete.prototype.SetActive = function ( active ){
	if (this.active !== null && this.active !== this.buffer){
		this.active.classList.remove('active');
	}
	if (active !== this.buffer){
		active.classList.add('active');
	}
	this.active = active;
	this.trigger('onChange');
};

CAutocomplete.prototype.Next = function (){
	if ( this.active.nextSibling ) {
		this.SetActive(this.active.nextSibling);
	} else {
		this.SetActive(this.buffer);
	}
};

CAutocomplete.prototype.Previous = function (){
	if (this.active.previousSibling){
		this.SetActive(this.active.previousSibling);
	}else{
		this.SetActive(this.buffer);
	}
};

CAutocomplete.prototype.AddRow = function ( data ){
	var el, ico, hint, text, attributes = extend({}, this.attributes.row);
	attributes.className += ' ' + this.GetType(data);
	ico = element('div', this.attributes.row.ico);
	hint = element('div', this.attributes.row.hint);
	text = element('div', this.attributes.row.text);
	elchild(this.handle, el = element('div', attributes, [ico, text, hint]));
	text.innerHTML =  this.GetTitle(data);
	hint.innerHTML = this.GetHint(data);
	el.data = data;
	return el;
};

CAutocomplete.prototype.Abort = function(){
	if (this.xhr !== undefined){
		this.xhr.abort();
	}
};

CAutocomplete.prototype.Clear = function (){
	this.Show(false);
	elclear(this.handle);
	clearTimeout(this.input_timer);
	this.Abort();
	this.active = null;
	this.buffer = {};
};

CAutocomplete.prototype.EventHandler = function ( event ){
	eventPrepare(event);
	if (this.isVisible === true){
		switch(event.code){
			case KEYS.UP:
				this.Previous();
				event.preventDefault();
				break;
			case KEYS.DOWN:
				this.Next();
				event.preventDefault();
				break;
			case KEYS.OK:
				this.Abort();
				this.trigger('onEnter', {text: this.GetValue(), type: this.GetType()});
				this.Clear();
				break;
			default:
				return false;
		}
		return true;
	}
};

Events.inject(CAutocomplete);
