'use strict';

var WINDOWS = {
	PORTAL: 'portal',
	HELP: 'help',
	DOWNLOAD_MANAGER: 'dlman',
	PVR: 'recordsManager',
	BROWSER: 'ibman',
	BROWSER_VIEW: 'ibmanView',
	PORTALS_LOADER: 'portalsLoader',
	SYSTEM_SETTINGS: 'systemSettings'
};

function getWindowKey ( windowName ) {
	return 'window.' + windowName + '.id';
}

function getWindowIdByName ( windowName ) {
	return stbStorage.getItem(getWindowKey(windowName));
}

function openWindow ( windowName, url ) {
	var windowKey = getWindowKey(windowName), // get storage key
		windowID = stbStorage.getItem(windowKey), // get window id from storage
		windowInfo;
	if ( windowID ) { // if window is opened
		try {
			windowInfo = JSON.parse(stbWindowMgr.windowInfo(windowID)); // get window info
			if ( windowInfo.result.url.indexOf(url) === -1 ) {
				// set black screen and reload
				stbWebWindow.messageSend(windowID, 'window.load', url);
			}
			// browser window hasn't show method
			if ( windowName === WINDOWS.BROWSER ) {
				// window recreation
				windowID = stbWindowMgr.openWebFace(url);
				stbStorage.setItem(windowKey, windowID);
			} else {
				// create a new one
				stbWindowMgr.windowShow(windowID);
			}
		} catch ( e ) {
			echo(e);
			stbWindowMgr.openWebFace(url);
		}
	} else {
		// browser window has special init method
		windowID = windowName === WINDOWS.BROWSER ? stbWindowMgr.openWebFace(url) : stbWindowMgr.windowInit(JSON.stringify({url:url, backgroundColor:'#000'}));
		stbStorage.setItem(windowKey, windowID);
	}
	return windowID;
}

function openWindowHelp ( path ) {
	openWindow(WINDOWS.HELP, PATH_ROOT + 'public/app/help/index.html?path=' + path);
}
