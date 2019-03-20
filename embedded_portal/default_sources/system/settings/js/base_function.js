'use strict';

/* jshint unused:false */

function myConfirm ( text, ok, exit ) {
	new CModalConfirm(SettingsPage, _('Confirm'), text, _('Cancel'), exit, _('Save'), ok);
}


function URLC ( url ) {
	var a = getIP(url);
	if ( a[0] !== 0 ) {
		return cIP(a[0]) && a[1] <= 65535;
	} else {
		return checkURL(url);
	}
}

function getIP ( url ) {
	var tt, tip, tput, zput, a, i;

	if ( /^(https?|http|ftp|telnet|igmp):\/\/[0-9.]+:[0-9]+$/.test(url) ) {
		tt = url.split(':');
		tip = tt[1].split('//');
		a = [tip[1], tt[2], 0];

		return a;
	} else if ( /^(https?|http|ftp|telnet|igmp):\/\/[0-9.]+$/.test(url) ) {
		tt = url.split('//');

		return [tt[1], 0, 0];
	} else if ( /^(https?|http|ftp|telnet|igmp):\/\/[0-9.]+:[0-9]+\//.test(url) ) {
		tt = url.split(':');
		tip = tt[1].split('//');
		tput = tt[2].split('/');
		zput = '';

		for ( i = 1; i < tput.length; i++ ) {
			zput += '/' + tput[i];
		}

		a = [tip[1], tput[0], zput];

		return a;
	}
	else if ( /^(https?|http|ftp|telnet|igmp):\/\/[0-9.]+\//.test(url) ) {
		tt = url.split('/');
		zput = '';

		for ( i = 3; i < tt.length; i++ ) {
			zput += '/' + tt[i];
		}

		return [tt[2], 0, zput];
	} else {
		return [0, 0, 0];
	}
}

function cIP ( ip ) {
	if ( ip === '' || ip === '0.0.0.0' ) {
		return false;
	}

	var test = ip.split('.');
	var pip = /^([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})$/;

	if ( test.length !== 4 ) {
		return false;
	}

	if ( pip.test(ip) ) {
		for ( var i = 0; i < 4; i++ ) {
			if ( parseInt(test[i], 10) < 0 || parseInt(test[i], 10) > 255 ) {
				return false;
			}
		}
	} else {
		return false;
	}

	return true;
}

function toIp ( t ) {
	var t1 = parseInt(t[0].value !== '' ? t[0].value : 0, 10);
	var t2 = parseInt(t[1].value !== '' ? t[1].value : 0, 10);
	var t3 = parseInt(t[2].value !== '' ? t[2].value : 0, 10);
	var t4 = parseInt(t[3].value !== '' ? t[3].value : 0, 10);

	return t1 + '.' + t2 + '.' + t3 + '.' + t4;
}

function ipOnFocus () {
	/*jshint validthis: true */

	this.select(true);
}

function checkURL ( url ) {
	var regURLrf = /(^(https?|http|ftp|telnet|igmp):\/\/)?[а-я0-9]~_\-\.]+\.[а-я]{2,9}(\/|:|\?[!-~]*)?$/i;
	var regURL = /(^(https?|http|ftp|telnet|igmp):\/\/)?(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/i;
	return regURLrf.test(url) || regURL.test(url);
}
