'use strict';

/**
 * Customization rules for manual tune
 * @author Stanislav Kalashnik <sk@infomir.eu>
 * @namespace
 */
var RULES = {
	'portalsLoader/useExtPortalsPage'  : true,    // Allow 'MENU' button at loader page ( if 'false' you can't start portals loader page by pressing 'MENU')
	'portalsLoader/allowSystemSettings': true,    // Allow system settings at portals loader page
	'page404/allowSystemSettings'      : true,    // Allow system settings at 404 page
	'hidePortalsURL'                   : false,   // Hide all portals URL at 404 page and portals loader page
	'allowInnerPortal'                 : true     // Allow inner portal at 404 page and portals loader page
};
