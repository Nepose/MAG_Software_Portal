'use strict';

/**
 * List of fatal error statuses
 */
Update.CrashStatuses = [1, 2, 3, 4, 7, 17, 19, 20, 22, 25, 27/*, 28, 29*/];

/**
 * Ready to update status
 * @type {number}
 */
Update.OkStatus = 21;

/**
 * Text representations of update statuses
 */
Update.StatusMessages = {
	1: "Signature init error",
	2: "Wrong device model",
	3: "Section size exceeds partition size on FLASH",
	4: "Required FLASH section not found. Aborting update",
	5: "Updating kernel",
	6: "Updating image",
	7: "Internal error",
	8: "Inspecting firmware",
	9: "Updating environment variables",
	10: "Updating Bootstrap section",
	11: "Skipping Bootstrap section",
	12: "Updating User FS section",
	13: "Skipping User FS section",
	14: "Updating second boot",
	15: "Updating logotype",
	16: "Update finished OK",
	17: "Wrong signature",
	18: "Erasing flash section",
	19: "Flash write error",
	20: "File write error",
	21: "Idle",
	22: "Invalid file header",
	23: "Inspecting update file",
	24: "File check finished",
	25: "File not found",
	26: "Initialising",
	27: "Read error"/*,
	28: "Loader error",
	29: "Storage not ready"*/
};

/**
 * Component that is responsible for updating the device
 * @param {Object} events List of event handlers (existing events: onCheck, onProgress, onError, onStart, onReady)
 * @constructor
 */
function Update ( events ) {
	this.bind(events);
	this.check_url = this.update_url = '';
	this.checked = false;
}

/**
 * Update device by TFTP
 * @param {number} [timeout] delay before start updating
 * @returns {boolean} return true if validation is passed
 */
Update.StartTFTP = function ( timeout ) {
	var bootstrap_url = parseUri(Update.DefaultUpdateUrls.bootstrap_url),
		lan_params = ["ipaddr", "gatewayip", "dnsip", "netmask", "ipaddr_conf"],
		lan_config = getEnvList(lan_params),
		type = "up_dhcp_tftp",
		count = 0;

	// check lan configuration type
	if ( lan_config.ipaddr_conf && lan_params.ipaddr_conf !== "0.0.0.0" ) { // manual configuration
		for ( var i = 0; i < lan_params.length; i++ ) { // check full lan manual configuration
			if ( lan_config[lan_params[i]] ) {
				count++;
			}
		}
		if ( count === lan_params.length ) { // manualy lan configuration
			type = "up_ip_tftp";
		} else {
			return false;
		}
	}

	if ( !this.CheckUpdateByTFTP() ) {
		return false;
	}

	// if all alright start updating
	if ( setEnvList({
			serverip_conf: bootstrap_url.host,
			tftp_path_conf: bootstrap_url.relative.substr(1) // remove first "/" in path needed for tftp
		}) ) {
		setTimeout(function () {
			gSTB.ExecAction("UpdateSW " + type);
		}, timeout || 0);
	}

	return true;
};

/**
 * Checks whether updated via tftp
 * @return {boolean}
 */
Update.CheckUpdateByTFTP = function () {
	var update_url = parseUri(Update.DefaultUpdateUrls.update_url),
		ip_regexp = /^((?:[0-9]{1,3}\.){3}[0-9]{1,3})$/, // for ip 192.168.1.221
		bootstrap_regexp = /^(tftp):\/\/((?:[0-9]{1,3}\.){3}[0-9]{1,3})(:[0-9]+)?(\/.+)+$/; // for url tftp://192.168.1.221/some/path

	// validate update_url
	if ( ["igmp", "tftp", "http"].indexOf(update_url.protocol) !== -1 ) { // check protocol fo update_url
		if ( update_url.protocol === "igmp" && update_url.relative !== '' ) { // check realtive path for igmp
			return false;
		}
		if ( update_url.protocol === "tftp" || update_url.protocol === "igmp" ) { // check if host is valid ip for tftp and igmp protocols
			if ( !update_url.host.match(ip_regexp) ) { return false; }
		}
	} else {
		return false;
	}
	if ( gSTB.GetDeviceModelExt().substr(0, 4) === "Aura" ) { return false; }
	// validate bootstrap_url
	return !!Update.DefaultUpdateUrls.bootstrap_url.match(bootstrap_regexp);
};

/**
 * Update device by multicast
 * @param {number} [timeout] delay before start updating
 * @returns {boolean} return true if validation is passed
 */
Update.StartMulticast = function ( timeout ) {
	var bootstrap_url = parseUri(Update.DefaultUpdateUrls.bootstrap_url);
	if ( this.CheckUpdateByMulticast ) { // validate update_url and bootstrap_url
		// if all data valid start updating
		if ( setEnvList({mcip_conf: bootstrap_url.host, mcport_conf: bootstrap_url.port}) ) {
			setTimeout(function () { gSTB.ExecAction("UpdateSW up_mc_url"); }, timeout || 0);
			return true;
		}
	}
	return false;
};

/**
 * Checks whether updated via multicast
 * @returns {boolean}
 */
Update.CheckUpdateByMulticast = function () {
	var regexp = /^(igmp):\/\/((?:[0-9]{1,3}\.){3}[0-9]{1,3})(:[0-9]+)?$/; // for url like igmp://192.168.1.221:444

	if ( !configuration.allowMulticastUpdate ) { return false; }
	//if ( gSTB.GetDeviceModelExt().substr(0, 4) === "Aura" ) { return false; }

	return (!!Update.DefaultUpdateUrls.bootstrap_url.match(regexp) && !!Update.DefaultUpdateUrls.update_url.match(regexp));
};

Update.DefaultUpdateUrls = getEnvList(['update_url', 'bootstrap_url']);

/**
 * Start update by http or from USB
 * @param {string} update_url valid path to the update image
 * @param {Boolean} force force update start
 */
Update.prototype.Start = function ( update_url, force ) {
	var status = stbUpdate.getStatus(), // get current update status
		activeBank = stbUpdate.getActiveBank(), // get active NAND number
		modelTemp = gSTB.RDir("Model").toUpperCase(), // get device model
		realActiveBank; // check if active bank corrupted and we loaded in emergency mode

	echo('Update.Start(update_url=' + update_url + ', force=' + force + ');');
	if ( (status == Update.OkStatus || force) && this.update_url === update_url ) { // check status
		echo('Update.Start(); => ready for update. Status:' + status + ', by force? ' + force);
		this.trigger("onStart"); // trigger onStart event
		echo('Update.Start(); => after onStart');
		this.SystemButtons(false);
		if ( modelTemp !== 'MAG250' && modelTemp !== 'MAG270' && modelTemp !== 'MAG275' ) { // check device model
			if ( activeBank != -1 && stbUpdate.GetFlashBankCount() != 2 ) { // check memory banks on old devices
				echo('Update.Start(); => trigger("onError") : bank error');
				this.trigger("onError", { // trigger onError event
					errorMessage: _('Unable to update active memory bank'),
					logMessage: 'Unable to update active memory bank',
					status: 30
				});
				return;
			}
		}
		if ( realActiveBank = stbStorage.getItem('nandEmergencyLoadingLogs') ) {
			realActiveBank = (JSON.parse(realActiveBank) || '').bootmedia;
			if ( realActiveBank === 'bank0' ) { activeBank = 0; }
			if ( realActiveBank === 'bank1' ) { activeBank = 1; }
		}
		echo('Update.Start(); => start stbUpdate.startUpdate for bank ' + (activeBank == 0 ? 1 : 0));
		if ( activeBank == 0 ) { // write to non active nand
			stbUpdate.startUpdate(1, update_url);
		} else {
			stbUpdate.startUpdate(0, update_url);
		}
	} else {
		echo('Update.Start(); => not ready for update. Status:' + status + ', is forced? ' + force + ', url is wrong? ' + (this.update_url !== update_url));
		echo('this.update_url (' + this.update_url + ') === update_url (' + update_url + ')');
		this.CheckUpdate(update_url, true); // if image not checked yet do this
	}
	this.CheckProgress();
};

/**
 * Called by timeout function which check update progress state
 */
Update.prototype.CheckProgress = function () {
	var status = stbUpdate.getStatus(), // get current update status code
		percent = stbUpdate.getPercents(),
		self = this;

	if ( !self.CheckError(status) ) return; // stop check progress if some error
	echo('Update.CheckProgress() => auto start if ready? ' + this.auto_start);
	if ( this.auto_start === true && status === Update.OkStatus ) { // if all ok and auto_start set in true start update after image check
		this.auto_start = false; // set autostart to false to prevent two update starts
		this.Start(this.update_url);
	}
	// fix percents - if update have been finished successfully percents value should be 100%
	if ( status === 16 ) {
		percent = 100;
	}
	echo('Update.CheckProgress() => set new progress value ' + stbUpdate.getPercents());
	this.trigger("onProgress", { // trigger onProgress event
		percent: percent,
		statusMessage: percent === 100 ? _(Update.StatusMessages[16]) : _(Update.StatusMessages[status]),
		logMessage: percent === 100 ? Update.StatusMessages[16] : Update.StatusMessages[status],
		status: percent === 100 ? 16 : status // after finish box will send status 21:"idle" again. Hide it from user (anyway next step - box reload).
	});
	this.progress_timeout = setTimeout(function () {self.CheckProgress()}, 1000); // set timeout for new progress check
};

/**
 * Check status of whether the error status
 * @param {number} status current status code
 * @return {boolean} false if this is error status and true is all ok
 */
Update.prototype.CheckError = function ( status ) {
	echo('Update.CheckError(status); => status code: ' + status);
	if ( Update.CrashStatuses.indexOf(status) !== -1 ) { // check status presence in CrashStatuses list
		echo('Update.CheckError(status); => error status found!: ' + status);
		this.trigger("onError", { // if given the error status then trigger onError event
			errorMessage: _(Update.StatusMessages[status]),
			logMessage: Update.StatusMessages[status],
			status: status
		});
		this.SystemButtons(true);
		return false;
	}
	return true;
};

/**
 * Called by timeout function which check checking image state
 * @param {string|null} update_url valid path to the update image (local or http://..), or null if check already started
 * @param {boolean} [start_on_ready] specifies start update if returned Update.OkStatus
 * @constructor
 */
Update.prototype.CheckUpdate = function ( update_url, start_on_ready ) {
	var status, self;

	echo('Update.CheckUpdate(update_url=' + update_url + ', start_on_ready=' + start_on_ready + ');');
	if ( typeof update_url === "string" ) { // if update_url is string start check
		stbUpdate.startCheck(this.check_url = update_url);
	}
	status = stbUpdate.getStatus(); // get current check status
	self = this;
	echo('Update.CheckUpdate(); => stop check if some error or got ready status. Current status: ' + status);
	if ( !this.CheckError(status) ) return; // stop check if some error
	this.trigger("onCheck", { // if all ok trigger onCheck event
		statusMessage: _(Update.StatusMessages[status]),
		logMessage: Update.StatusMessages[status],
		status: status
	});
	if ( status === Update.OkStatus ) { // check all ok status
		this.update_url = this.check_url;
		this.trigger("onReady"); // if all ok trigger onReady event
		echo('Update.CheckUpdate(); => check is ok. Start autoupdate? ' + start_on_ready);
		if ( start_on_ready === true ) {
			this.Start(this.update_url); // start updating if parameter start_on_ready set to true
		}
		return;
	}
	clearTimeout(this.check_update_timeout);
	this.check_update_timeout = setTimeout(function () { // set timeout for new check
		self.CheckUpdate(null, start_on_ready);
	}, 100);
};

/**
 * Return info about image by which it check
 * Work only if current status is Update.OkStatus
 * @returns {Object|null}
 */
Update.prototype.GetImageInfo = function () {
	echo('Update.GetImageInfo(); => is info about new image ready? status:' + stbUpdate.getStatus());
	if ( stbUpdate.getStatus() === Update.OkStatus ) {
		echo('Update.GetImageInfo(); => {date:' + parseDate(stbUpdate.getImageDateStr()) + ', description:' + stbUpdate.getImageDescStr() + ', version:' + stbUpdate.getImageVersionStr() + '}');
		return {
			date: parseDate(stbUpdate.getImageDateStr()),
			description: stbUpdate.getImageDescStr(),
			version: stbUpdate.getImageVersionStr()
		}
	} else {
		return null;
	}
};

/**
 * Return information about current image
 * @returns {Object}
 */
Update.prototype.GetCurrentImageInfo = function () {
	if ( this.curr_info === undefined ) {
		var info = JSON.parse(gSTB.GetEnv(JSON.stringify({varList: ['Image_Desc', 'Image_Date', 'Image_Version']}))).result;
		this.curr_info = {
			date: parseDate(info.Image_Date),
			description: info.Image_Desc,
			version: info.Image_Version
		}
	}
	/*
	TODO: check this code on MAG352
	 var obj = {
	 date: new Date(NaN);
	 }

	 JSON.stringify(obj);
	 */
	// echo('Update.GetCurrentImageInfo(); => Return:' + JSON.stringify(this.curr_info));
	return this.curr_info;
};

/**
 * Brings Update to its original appearance
 */
Update.prototype.Clear = function () {
	clearTimeout(this.check_update_timeout);
	clearTimeout(this.progress_timeout);
	this.auto_start = false;
	this.update_url = '';
};

Update.prototype.SystemButtons = function ( enable ) {
	gSTB.EnableServiceButton(enable);
	gSTB.EnableVKButton(enable);
	gSTB.EnableAppButton(enable);
	gSTB.EnableTvButton(enable);
};

Events.inject(Update); // inject Events functionality
