/**
 * Download Manager main data model handling
 * @author Igor K
 */

'use strict';

app.models.main = (function () {
	/**
	 * global properties
	 * @namespace
	 */
	var module = {
		downloads : [],
		environmentData: null
	};

	/**
	 * Loads downloads and environment data
	 */
	module.load = function () {
		module.downloads = JSON.parse(stbDownloadManager.GetQueueInfo());
		module.environmentData = JSON.parse(gSTB.GetEnv(JSON.stringify({varList:['mount_media_ro']})));
	};

	// export
	return module;
}());