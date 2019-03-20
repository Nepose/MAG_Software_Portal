'use strict';

function SpeedtestStatic () {
}

function Speedtest ( url ) {

	if ( !url ) {
		echo('Empty test download URL!');
	}

	this._url = url;
	this._interval_time = 1;
	this._static = SpeedtestStatic;
}

Speedtest.prototype.start = function () {
	echo('Speedtest.start');

	var result = this._result = this._getResult();

	if ( result && result.hasOwnProperty('id') ) {
		this.stop(result.id);
	}

	parent.stbDownloadManager.AddMeasureJob(this._url);

	this.startChecking();
};

Speedtest.prototype.stop = function ( id ) {
	echo('Speedtest.stop', id);

	id = id || this._result.id;

	echo('id', id);

	window.clearInterval(this._static._interval);
	parent.stbDownloadManager.DeleteJob(id, false);
};

Speedtest.prototype.startChecking = function () {
	echo('Speedtest.t_check');

	window.clearInterval(this._static._interval);

	var self = this;
	self.check();
	this._static._interval = window.setInterval(function () {
		self.check();
	}, this._interval_time * 1000);
};

Speedtest.prototype.setIntervalTime = function ( value ) {
	echo('Speedtest.setIntervalTime', value);

	this._interval_time = value;
};

Speedtest.prototype.onSuccess = function ( callback ) {
	echo('Speedtest.onSuccess');

	this._callback = callback;
};

Speedtest.prototype.onCheck = function ( callback ) {
	echo('Speedtest.onCheck');

	this._check_callback = callback;
};

Speedtest.prototype._getResult = function () {

	var result = parent.stbDownloadManager.GetMeasureInfo();

	echo('GetMeasureInfo', result);

	result = JSON.parse(result);
	result = result[0];

	return result;
};

Speedtest.prototype.check = function () {
	echo('Speedtest.check');

	var result = this._result = this._getResult();

	echo('this._static._interval', this._static._interval);

	if ( result.progressPct == 100 ) {
		this._callback && this._callback(this.getHumanReadableSpeed(result));
		this.stop(result.id);
	} else {
		this._check_callback && this._check_callback(result);
	}
};

Speedtest.prototype.getSpeed = function ( result ) {
	echo('Speedtest.getSpeed');

	return (result.sizeDone * 1000) / result.timeWasted;
};

Speedtest.prototype.getHumanReadableSpeed = function ( result ) {
	echo('Speedtest.getHumanReadableSpeed');

	var speed = this.getSpeed(result) * 8,
		postfix, divider;

	if ( speed >= 1048576 ) {
		postfix = 'Mbps';
		divider = 1048576;
	} else if ( speed >= 1024 ) {
		postfix = 'Kbps';
		divider = 1024;
	} else {
		postfix = 'bps';
		divider = 1;
	}

	return (speed / divider).toFixed(2) + ' ' + postfix;
};
