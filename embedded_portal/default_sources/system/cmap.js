'use strict';

/**
 * Base class for Google Map
 * @class CMap
 * @constructor
 * @author Denys Vasylyev
 */
function CMap ( parent, parameters ) {
	/**
	 * Map object
	 * @type {Object}
	 */
	this.map = null;

	/**
	 * Map marker object
	 * @type {Object}
	 */
	this.marker = null;

	/**
	 * Map container
	 * @type {Node}
	 */
	this.container = parameters.container;

	/**
	 * Events object
	 * @type {Object}
	 */
	this.events = parameters.events || {};

	/**
	 * Global variable determines whether the map is loaded
	 * @type {boolean}
	 */
	window.googleMapsApiScriptLoaded = window.googleMapsApiScriptLoaded || false;

	CBase.call(this, parent || null);

	this.bind(this.events);
}

// extending
CMap.prototype = Object.create(CBase.prototype);
CMap.prototype.constructor = CMap;


/**
 * Load Google Maps Api script method with the callback function in url
 * @param {string} objTitle string with the name of the object in which the callback function will be called
 * @param {string} language code of the displayed map
 */
CMap.prototype.LoadGoogleMapsApiScript = function ( objTitle, language ) {
	loadScript('https://maps.googleapis.com/maps/api/js?callback=' + objTitle + '.GoogleMapsApiScriptCallback&language=' + language);
};

/**
 * Function call when the script is loaded
 */
CMap.prototype.GoogleMapsApiScriptCallback = function () {
	window.googleMapsApiScriptLoaded = true;
	this.trigger('onGoogleMapsApiScriptCallback');
};

/**
 * Build google map method
 * @param {Object} mapOptions object with properties to create or modify map
 * @param {boolean} useMarker show/hide map marker
 * @param {boolean} showMapIfExists show/hide map if map object already exists
 */
CMap.prototype.BuildMap = function ( mapOptions, useMarker, showMapIfExists ) {
	var self = this;

	if ( this.map ) {
		this.map.setOptions(mapOptions);
		if ( showMapIfExists ) {
			this.Visible(true);
		}
	} else {
		this.map = new google.maps.Map(this.container, mapOptions);
	}

	if ( useMarker ) {
		if ( this.marker ) {
			this.marker.setPosition(mapOptions.center);
		} else {
			this.marker = new google.maps.Marker({
				position: mapOptions.center,
				map: this.map
			});
		}

		this.marker.setVisible(true);
	} else {
		if ( this.marker ) {
			this.marker.setVisible(false);
		}
	}

	google.maps.event.addListenerOnce(this.map, 'tilesloaded', function() {
		self.trigger('onGoogleMapReady');
	});
};

/**
 * Set visibility mode
 * @param {boolean} [mode=false] show/hide the component
 */
CMap.prototype.Visible = function ( mode ) {
	this.container.style.visibility = Boolean(mode) ? 'visible' : 'hidden';
};

Events.inject(CMap);
