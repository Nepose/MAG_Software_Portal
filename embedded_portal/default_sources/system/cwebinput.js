'use strict';

/**
 * @param parent
 * @param parameters
 * @constructor
 * @sample
 * window.webfilter = new CWebInput(document.body, {
 *		input: document.getElementById("web-filter"),
 *		hint: "Enter url or text to search",
 *		events: {
 *			onEnter: function(value, type){
 *				console.log("Value: " + value);
 *				console.log("Type: " + type);
 *			}
 *		},
 *		autocomplete: true
 *	});
 */
function CWebInput ( parent, parameters ) {
	var self = this, ac_attrs;
	parameters = extend({
		style: "web-input main-filter-input",
		icons: [
			{
				name : "ico_search",
				type : "left",
				style: "black_search left"
			},
			{
				name : "ico_web",
				type : "left",
				style: "web-ico left"
			},
			{
				name : "ico_load",
				type : "left",
				style: "load-ico left",
				src: "ico_waiting2.png"
			},
			{
				name : "site_favicon",
				type : "left",
				style: "favicon left",
				src: '',
				attributes: {
					onload: function() {
						this.loaded = true;
					},
					onerror: function() {
						this.loaded = false;
					}
				}
			},
			{
				name : "ico_star_fade",
				click: function ( event ) {
					this.FillStar(true);
					this.trigger("onStar");
					event.stopPropagation();
				},
				style: "fade-star"
			},
			{
				name : "ico_star_full",
				click: function ( event ) {
					this.FillStar(false);
					this.trigger("onUnstar");
					event.stopPropagation();
				},
				style: "full-star"
			},
			{
				name : "f4",
				click: function ( event ) {
					this.trigger("onKey");
					event.stopPropagation();
				}
			}
		]
	}, parameters);

	if (parameters.parent !== undefined){
		elchild(parameters.parent, parameters.parent = element('div', {className: "cweb-input-wrapper"}));
	}else if (parameters.input !== undefined){
		elchild(parameters.input.parentNode, parameters.parent =  element('div', {className: "cweb-input-wrapper"}, parameters.input));
	}

	CInput.call(this, parent || null, parameters);

	this.name = "CWebInput";

	if ( parameters.stared ) {
		this.FillStar(true);
	}

	if ( typeof parameters.autocomplete === "object" || parameters.autocomplete === true ) {
		if ( parameters.autocomplete === true )
			 parameters.autocomplete = {};
		ac_attrs = extend(CWebInput.autocomplete_defaults, parameters.autocomplete, true);

		// if there is no function for getting data in parameters then assign default value
		if ( ac_attrs.data === undefined )
			ac_attrs.data = function ( res ) {
				var data = null,
					result = [];

				if ( res ) {
					try {
						// format data for better look
						data = JSON.parse(unescape(res))[1];

						data.sort(function( a ){
							return a[0].indexOf(self.GetValue()) === 0 ? -1 : 0;
						});

						if ( data ) {
							data.forEach(function ( el ) {
								result.push({
									title: el[0],
									hint: _("Search in Google") // add hints for google data
								});
							});
						}

						if ( validateUrl(self.GetValue()) ) // if valid link entered add appropriate item to the beginning of the list
							result.unshift({title: self.GetValue(), type: 'url', hint: _("Open link")});
						else if (result[0] === undefined || result[0].title.indexOf(self.GetValue()) === -1)
							result.unshift({title: self.GetValue(), type: 'search', hint: _("Search in Google")});
					} catch ( error ) {
						echo(error);
					}
				}

				return result;
			};

		ac_attrs.base = this.handle;
		ac_attrs.input = this.input;
		if (ac_attrs.events === undefined) ac_attrs.events = {};

		parameters.autocomplete = new CAutocomplete(document.body, ac_attrs);
	}

	this.SetAutocomplete(parameters.autocomplete);

	this.SetState('search');

	elchild(parameters.parent, this.$progress_bar = element('div', {className: "progress-bar"}));

	this.input.oninput =  (function(oninput){
		return function(event){
			if (self.GetValue() === '')
				self.SetState('search');
			if (typeof oninput === 'function') {
				oninput(event);
			}
		}
	})(this.input.oninput);
}

// extending
CWebInput.prototype = Object.create(CInput.prototype);
CWebInput.prototype.constructor = CWebInput;

CWebInput.prototype.SetFavicon = function ( url ){
	url = parseUri(url);
	this.icons['site_favicon'].src = url.protocol + "://" + url.authority + "/favicon.ico";
};

CWebInput.prototype.SetAutocomplete = function ( autocomplete ){
	CInput.prototype.SetAutocomplete.call(this, autocomplete);
	var title, length, def, self = this;
	if (typeof autocomplete === 'function' || typeof autocomplete === "object"){
		this.autocomplete.bind({
			onChange: function(){
				title = this.GetValue();
				def = this.GetDefault();
				self.SetValue(title, true);
				if (title.indexOf(def) === 0){
					length = def.length;
					self.SetValue(title, true);
					self.input.selectionStart = length;
					self.input.selectionEnd = title.length;
				}
				self.ShowHint(false);
			},
			onEnter: function ( data ){
				self.trigger("onEnter", data);
			}
		});
	}
};

/**
 * Меняет тип инпута ( изменяет левую иконку )
 * @param {string} type Тип инпута
 */
CWebInput.prototype.SetState = function ( type ){
	var self = this;
	if (CWebInput.states.indexOf(type) === -1) return;
	CWebInput.states.forEach(function(type){
		self.handle.classList.remove(type);
	});
	this.type = type ||CWebInput.states[0];
	this.handle.classList.add(type);
};

// Все возможные типы которые можно назначить инпуту
CWebInput.states = ['search', 'web', 'load', 'favicon'];

// Параметры поумолчания для автодополнения
CWebInput.autocomplete_defaults  = {
	titleField: "title",
	hintField: "hint",
	typeField: "type",
	size: 5,
	/**
	 * @tutorial
	 *
	 * If URI will changed and autocomplete stops working, try to use this algorithm to fix:
	 * - open www.google.com
	 * - open preferred network sniffing tool (Wireshark, "Network" tab in Firefox/Chrome Developer tools, ...)
	 * - type something in search field and look at requested URI
	 */
	url: "https://www.google.com/complete/search?client=psy-ab&hl=uk&gs_rn=64&gs_ri=psy-ab&cp=1&gs_id=1tc&q="
};

CWebInput.prototype.FillStar = function ( fill ){
	this.favorite = fill;
	if (fill === true)
		this.handle.classList.add("favorite");
	else
		this.handle.classList.remove("favorite");
};

CWebInput.prototype.ShowStar = function ( show ){
	if (show === true)
		this.handle.classList.add("star");
	else
		this.handle.classList.remove("star");
};

CWebInput.prototype.ShowFavIcon = function () {
	if (this.icons["site_favicon"].loaded === true){
		this.SetState("favicon");
	}else{
		this.SetState("web");
	}
};

CWebInput.prototype.SetProgress = function ( progress ) {
	if (progress !== undefined){
		this.$progress_bar.style.width = progress + "%";
	}else{
		this.$progress_bar.style.width = "0px";
	}
};

// true - stop next events
/**
 * @return {boolean}
 */
CWebInput.prototype.EventHandler = function ( event ) {
	eventPrepare(event, true, 'CWebInput');
	var self = this,
		event_res = false;
	if ( this.trigger("onEvent", event)[0] === true ) return true;
	switch ( event.code ) {
		case KEYS.F4:
			if ( this.IsFocused() ){
				this.blur();
			}else{
				this.focus();
			}
			event_res = this.trigger("onKey")[0];
			return true;
		case KEYS.EXIT:
			if (this.autocomplete && this.autocomplete.isVisible === true){
				this.autocomplete.Show(false);
				return true;
			}
			event_res = this.trigger("onExit")[0];
			return true;
		case KEYS.OK:
			if ( this.IsFocused() ){
				gSTB.HideVirtualKeyboard();
				if (this.autocomplete.isVisible === true){
					if (typeof this.autocomplete.EventHandler === 'function') {
						this.autocomplete.EventHandler(event);
					}
				}else{
					this.autocomplete.Abort();
					echo("CWebInput:onEnter");
					this.trigger("onEnter", {text: self.GetValue(), type: validateUrl(self.GetValue()) ? 'url' : 'search'});
					this.autocomplete.Clear();
				}
				event.preventDefault();
				return true;
			}
		case KEYS.RIGHT:
			if ( this.input.selectionStart !== this.input.selectionEnd) {
				this.input.oninput();
			}
		case KEYS.UP:
		case KEYS.DOWN:
			if (this.autocomplete && typeof this.autocomplete.EventHandler === 'function')
				this.autocomplete.EventHandler(event);
			return true;
	}
	if ( event_res === true ) return true;
};
