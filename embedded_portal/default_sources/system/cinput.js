'use strict';

var CINPUT_IMG_PATH = PATH_IMG_PUBLIC;

function CInput ( parent, parameters ) {
	var _default = '', self = this;
	this.parameters = parameters;
	/**
	 * Default values for element initialization
	 * @type {Object}
	 */
	this.attributes = {
		input : {
			className: 'cinput-input',
			type: parameters.type || 'text'
		},
		hint : {
			className: 'cinput-hint cinput-input'
		},
		icon : {
			className: 'cinput-icon'
		},
		wrapper : {
			className: 'cinput-wrapper'
		},
		'text-wrapper': {
			className: 'cinput-text-wrapper'
		}
	};

	this.SetAutocomplete(parameters.autocomplete);

	this.FoldedClass = 'folded';

	if ( parameters.attributes !== undefined ) {
		extend(this.attributes, parameters.attributes);
	}
	if ( parameters.folded === true ) {
		this.attributes.wrapper.className += ' ' + this.FoldedClass;
	}
	if ( parameters.style !== undefined ) {
		this.attributes.wrapper.className += ' ' + parameters.style;
	}

	this.events = parameters.events || {};

	CBase.call(this, parent || null);

	this.bind(this.events);

	this.type = 'input';

	this.name = parameters.name || 'input';

	if ( !(this.parentNode = parameters.parent) ) {
		if ( parameters.input === undefined ){
			throw('parent or input parameter must be specified');
		}
		this.parentNode = parameters.input.parentNode;
	}
	this.parameters.icons = this.parameters.icons || [];

	this.icons = {};

	self.IsChanged = function () {
		return _default !== self.GetValue();
	};

	self.GetDefault = function () {
		return _default;
	};

	self.SetDefault = function ( def ){
		_default = def;
	};

	this.Init(this.GenerateHandle());

	elchild(this.parentNode, this.handle);
}

// extending
CInput.prototype = Object.create(CBase.prototype);
CInput.prototype.constructor = CInput;

CInput.prototype.GenerateHandle = function () {
	var i, icon, attrs, changed,
		self = this;
	this.row = element('tr');
	if ( this.parameters.hint !== undefined ) {
		this.DefaultHint = this.attributes.hint.value = this.parameters.hint;
		this.hint = element('input', extend(this.attributes.input, this.attributes.hint, false));
	}
	if ( this.parameters.input === undefined ) {
		if ( this.parameters.value !== undefined ){
			this.attributes.input.value = this.parameters.value;
			this.SetDefault(this.parameters.value);
		}
		elchild(this.row, element('td', this.attributes['text-wrapper'], [this.input = element('input', this.attributes.input), this.hint || '']));
	} else {
		this.input = this.parameters.input;
		this.input.parentNode.removeChild(this.input);
		this.input.className += this.attributes.input.className;
		elchild(this.row, element('td', {}, element('div', this.attributes['text-wrapper'], [this.input, this.hint || ''])));
		if ( this.input.value !== '' ){
			this.ShowHint(false);
			this.SetDefault(this.input.value);
		}
	}
	this.input.oninput = function ( e ) {
		changed = false;
		self.trigger('onChange', e);
		if ( self.GetValue() !== '' ) {
			self.ShowHint(false);
		} else {
			self.SetHint(self.DefaultHint);
			self.ShowHint(true);
		}
	};
	this.input.onblur = function () {
		if ( self.GetValue() !== '' ) {
			self.ShowHint(changed);
		} else {
			self.SetHint(self.DefaultHint);
			self.ShowHint(true);
		}
	};

	if ( this.parameters.icons !== undefined ) {
		for ( i = 0; i < this.parameters.icons.length; i++ ) {
			icon = this.parameters.icons[i];
			attrs = extend({}, this.attributes.icon);
			attrs.className += ' ' + (icon.style || '');
			this.AddIcon(icon, attrs);
		}
	}
	return element('table', this.attributes.wrapper, this.row);

};

CInput.prototype.SetAutocomplete = function ( autocomplete ){
	this.autocomplete = autocomplete;
};

CInput.prototype.onInit = function () {

};

CInput.prototype.ShowIcon = function ( name, show ) {
	if ( this.icons[name] !== undefined ) {
		this.icons[name].parentNode.style.display = show === true ? 'table-cell' : 'none';
	}
};

CInput.prototype.ApplyHint = function () {
	this.SetValue(this.GetHint());
};

CInput.prototype.AddIcon = function ( icon, attrs ) {
	var self = this, iconFile = null,
		attributes = extend(icon.attributes, {}),
		remoteControlButtonsImagesPath = configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/';

	if ( icon.src !== undefined ) {
		iconFile = icon.src;
	} else {
		iconFile = icon.name ? icon.name + '.png' : null;
	}

	if (iconFile === 'f4.png') {
		if ( iconFile ) {
			attributes.src = (this.parameters.icons_path || remoteControlButtonsImagesPath) + iconFile;
		}
	} else {
		if ( iconFile ) {
			attributes.src = (this.parameters.icons_path || CINPUT_IMG_PATH) + iconFile;
		}
	}

	element('td', attrs || this.attributes.icon, this.icons[icon.name] = element('img', attributes));
	if ( icon.type === 'left' ) {
		this.row.insertBefore(this.icons[icon.name].parentNode, this.row.firstChild);
	} else {
		this.row.appendChild(this.icons[icon.name].parentNode);
	}
	if ( typeof icon.click === 'function' ) {
		this.icons[icon.name].onclick = function ( event ) {
			icon.click.call(self, event);
		};
	}
};

CInput.prototype.RemoveIcon = function ( icon_name ) {
	if ( this.icons[icon_name] !== undefined ) {
		this.row.removeChild(this.icons[icon_name].parentNode);
	}
};

/**
 *
 * @param value
 * @param [siltent]
 * @constructor
 */
CInput.prototype.SetValue = function ( value, siltent ) {
	this.input.value = value;
	this.ShowHint(value === '');
	if ( siltent !== true ){
		this.trigger('onChange');
		this.input.oninput();
	}
};

CInput.prototype.GetValue = function () {
	return this.input.value;
};

CInput.prototype.SetHint = function ( hint ) {
	if ( this.hint !== undefined ){
		this.hint.value = hint;
		return this.hint.value;
	}
};

CInput.prototype.GetHint = function () {
	if ( this.hint !== undefined ){
		return this.hint.value;
	}
};

CInput.prototype.ShowHint = function ( show ) {
	if ( this.hint !== undefined ){
		this.hint.style.display = show === true ? 'block' : 'none';
	}
};

/**
 *
 * @param fold
 * @param [stop_event]
 * @param [manage_focus]
 * @constructor
 */
CInput.prototype.Fold = function ( fold, manage_focus, stop_event ) {
	if ( fold === true ) {
		if ( this.handle.className.indexOf('folded') === -1 ) {
			this.handle.className += ' ' + this.FoldedClass;
			if ( stop_event !== true ) {
				this.trigger('onFold');
			}
			if ( manage_focus === true ) {
				this.blur();
			}
		}
		gSTB.HideVirtualKeyboard();
	} else {
		this.handle.className = this.handle.className.replace(this.FoldedClass, '');
		if ( stop_event !== true ) {
			this.trigger('onUnfold');
		}
		if ( manage_focus === true ) {
			this.focus();
			gSTB.ShowVirtualKeyboard();
		}
	}
};

CInput.prototype.Reset = function () {
	this.Fold(this.parameters.folded === true, true);
	this.SetValue(this.GetDefault(), true);
};

CInput.prototype.focus = function () {
	this.input.focus();
};

CInput.prototype.blur = function () {
	this.input.blur();
};

CInput.prototype.select = function () {
	this.input.select();
};

/**
 * @return {boolean}
 */
CInput.prototype.IsFolded = function () {
	return this.handle.className.indexOf(this.FoldedClass) !== -1;
};

/**
 * @return {boolean}
 */
CInput.prototype.IsFocused = function () {
	return this.input === document.activeElement;
};

CInput.prototype.EventHandler = function () {};

Events.inject(CInput);


/**
 * Filter input component
 * @param parent
 * @param parameters
 * @constructor
 * @example weather_location = new CFilterInput(this, {
			input: document.getElementById("place"),
			hint: "Enter city name please...",
			folded: true,
			events:{
				onChange: function(){
					weather.getSuggestsList(this.GetValue());
				},
				onUnfold: function(){
					WeatherPage.$bcrumb.style.display = 'none';
				},
				onFold: function(){
					WeatherPage.$bcrumb.style.display = 'table-cell';
				},
				onKey: function(){
					weather.newLocation();
				},
				onExit: function(){
					WeatherPage.actionExit();
				}
			}
		});
 */
function CFilterInput ( parent, parameters ) {
	parameters = extend({
		style: 'main-filter-input',
		icons: [
			{
				name : 'ico_search',
				type : 'left',
				style: 'black_search'
			},
			{
				name : 'ico_search2',
				type : 'left',
				style: 'white_search'
			},
			{
				name : 'f4',
				click: function () {
					this.Fold(!this.IsFolded(), true);
					this.trigger('onKey');
				}
			}
		]
	}, parameters);
	CInput.call(this, parent || null, parameters);
}

// extending
CFilterInput.prototype = Object.create(CInput.prototype);
CFilterInput.prototype.constructor = CFilterInput;

// true - stop next events
/**
 * @return {boolean}
 */
CFilterInput.prototype.EventHandler = function ( event ) {
	eventPrepare(event, true, 'CFilterInput');
	var event_res = false;
	if ( this.trigger('onEvent', event)[0] === true ) {
		return true;
	}
	switch ( event.code ) {
		case KEYS.F4:
			this.Fold(!this.IsFolded(), true);
			event_res = this.trigger('onKey')[0];
			break;
		case KEYS.EXIT:
			if ( !this.IsFolded() ) {
				this.Fold(true, true);
				this.trigger('onExit');
				return true;
			}
			break;
		case KEYS.OK:
			if ( !this.IsFolded() ) {
				event_res = this.trigger('onEnter')[0];
				echo(event_res, 'onEnter');
				this.Fold(true, true);
				event.preventDefault();
			}
			break;
		case KEYS.CHANNEL_NEXT:
		case KEYS.CHANNEL_PREV:
			event.preventDefault();
			break;
	}
	if ( this.IsFolded() !== true || event_res === true ) {
		return true;
	}
};
