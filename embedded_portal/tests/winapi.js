'use strict';

module('Windows API');

test('methods availability', function () {
	strictEqual(typeof stbWindowMgr.windowInit,   'function', 'stbWindowMgr.windowInit');
	strictEqual(typeof stbWindowMgr.windowAttr,   'function', 'stbWindowMgr.windowAttr');
	strictEqual(typeof stbWindowMgr.windowList,   'function', 'stbWindowMgr.windowList');
	strictEqual(typeof stbWindowMgr.windowInfo,   'function', 'stbWindowMgr.windowInfo');
	strictEqual(typeof stbWindowMgr.windowShow,   'function', 'stbWindowMgr.windowShow');
	strictEqual(typeof stbWindowMgr.windowHide,   'function', 'stbWindowMgr.windowHide');
	strictEqual(typeof stbWindowMgr.windowLoad,   'function', 'stbWindowMgr.windowLoad');
	strictEqual(typeof stbWindowMgr.windowClose,  'function', 'stbWindowMgr.windowClose');
	strictEqual(typeof stbWindowMgr.windowActive, 'function', 'stbWindowMgr.windowActive');
	strictEqual(typeof stbWebWindow.windowId,         'function', 'stbWebWindow.windowId');
	strictEqual(typeof stbWebWindow.messageSend,      'function', 'stbWebWindow.messageSend');
	strictEqual(typeof stbWebWindow.messageBroadcast, 'function', 'stbWebWindow.messageBroadcast');
});

// global event
var stbEvent = {
	onEvent : function(data){},
	event   : 0,
	onMessage: function ( windowId, message, data ) {

	},
	onBroadcastMessage: function ( windowId, message, data ) {

	}
};
