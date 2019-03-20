'use strict';

function CModalShowWiredEthernetInfo ( parent ) {
	var	self = this,
		environmetData = JSON.parse(gSTB.GetEnv(JSON.stringify({varList: ['lan_noip', 'ipaddr_conf', 'dnsip']}))),
		linkStatus = gSTB.GetLanLinkStatus() ? 'UP' : 'DOWN',
		MACAdress = gSTB.GetDeviceMacAddress(),
		IPAdress = gSTB.RDir('IPAddress'),
		networkMask = gSTB.RDir('IPMask'),
		gateway = gSTB.GetNetworkGateways(),
		DNSServer = gSTB.GetNetworkNameServers(),
		currentConfiguration = null,
		elementsArray = null;

	if ( environmetData.result.lan_noip === 'true' ) {
		currentConfiguration = _('No config');
	} else {
		if ( cIP(environmetData.result.ipaddr_conf) ) {
			currentConfiguration = _('Static IP');
		} else {
			currentConfiguration = 'DHCP';
			if ( cIP(environmetData.result.dnsip) ) {
				currentConfiguration += '(' + _('Manual DNS') + ')';
			}
		}
	}

	elementsArray = element('table', {className: 'main maxw network-info'}, [
		element('tr', {}, [
			element('td', {className: 'name'}, _('Current configuration:')),
			element('td', {className: 'data'}, this.$currentConfiguration = element('span', {className: ''}, currentConfiguration))
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('Link status:')),
			element('td', {className: 'data'}, this.$linkStatus = element('span', {className: linkStatus === 'UP' ? 'link-status up' : 'link-status down'}, linkStatus))
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('MAC address:')),
			element('td', {className: 'data'}, this.$MACAdress = element('span', {className: ''}, MACAdress))
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('IP address:')),
			element('td', {className: 'data'}, this.$IPAdress = element('span', {className: ''}, IPAdress))
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('Network mask:')),
			element('td', {className: 'data'}, this.$networkMask = element('span', {className: ''}, networkMask))
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('Gateway:')),
			element('td', {className: 'data'}, this.$gateway = element('span', {className: ''}, gateway === '' ? 'n/a' : gateway.replace(/\r\n|\r|\n/g, ', ')))
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('DNS server:')),
			element('td', {className: 'data'}, this.$DNSServer = element('span', {className: ''}, DNSServer === '' ? 'n/a' : DNSServer.replace(/\r\n|\r|\n/g, ', ')))
		])
	]);

	CModalAlert.call(this, parent, _('Network info'), elementsArray, _('Cancel'), null);

	this.bpanel.btnRefresh = this.bpanel.Add(KEYS.REFRESH, 'refresh.png', _('Refresh'), function () {
		self.bpanel.Hidden(self.bpanel.btnRefresh, true);
		setTimeout(function () {
			var	environmetData = JSON.parse(gSTB.GetEnv(JSON.stringify({varList: ['lan_noip', 'ipaddr_conf', 'dnsip']}))),
				linkStatus = gSTB.GetLanLinkStatus() ? 'UP' : 'DOWN',
				MACAdress = gSTB.GetDeviceMacAddress(),
				IPAdress = gSTB.RDir('IPAddress'),
				networkMask = gSTB.RDir('IPMask'),
				gateway = gSTB.GetNetworkGateways(),
				DNSServer = gSTB.GetNetworkNameServers(),
				currentConfiguration = null;

			if ( environmetData.result.lan_noip === 'true' ) {
				currentConfiguration = _('No config');
			} else {
				if ( cIP(environmetData.result.ipaddr_conf) ) {
					currentConfiguration = _('Static IP');
				} else {
					currentConfiguration = 'DHCP';
					if ( cIP(environmetData.result.dnsip) ) {
						currentConfiguration += '(' + _('Manual DNS') + ')';
					}
				}
			}

			if (linkStatus === 'UP') {
				self.$linkStatus.className = 'link-status up';
			} else {
				self.$linkStatus.className = 'link-status down';
			}

			self.$currentConfiguration.innerHTML = currentConfiguration;
			self.$linkStatus.innerHTML = linkStatus;
			self.$MACAdress.innerHTML = MACAdress;
			self.$IPAdress.innerHTML = IPAdress;
			self.$networkMask.innerHTML = networkMask;
			self.$gateway.innerHTML = gateway === '' ? 'n/a' : gateway.replace(/\r\n|\r|\n/g, ', ');
			self.$DNSServer.innerHTML = DNSServer === '' ? 'n/a' : DNSServer.replace(/\r\n|\r|\n/g, ', ');
			self.bpanel.Hidden(self.bpanel.btnRefresh, false);
		}, 400);
	});
}

CModalShowWiredEthernetInfo.prototype = Object.create(CModalAlert.prototype);
CModalShowWiredEthernetInfo.prototype.constructor = CModalShowWiredEthernetInfo;


function CModalShowPPPoEInfo ( parent ) {
	var	self = this,
		environmetData = JSON.parse(gSTB.GetEnv(JSON.stringify({varList: ['pppoe_enabled', 'pppoe_login', 'pppoe_dns1']}))),
		linkStatus = gSTB.GetPppoeLinkStatus() ? 'UP' : 'DOWN',
		IPAdress = gSTB.GetPppoeIp(),
		gateway = gSTB.GetNetworkGateways(),
		DNSServer = gSTB.GetNetworkNameServers(),
		currentConfiguration = null,
		elementsArray = null;

	if ( environmetData.result.pppoe_enabled === 'true' ) {
		currentConfiguration = environmetData.result.pppoe_login;
	} else {
		currentConfiguration = _('Disabled');
	}

	elementsArray = element('table', {className: 'main maxw network-info'}, [
		element('tr', {}, [
			element('td', {className: 'name'}, _('Current configuration:')),
			element('td', {className: 'data'}, this.$currentConfiguration = element('span', {className: ''}, currentConfiguration))
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('Link status:')),
			element('td', {className: 'data'}, this.$linkStatus = element('span', {className: linkStatus === 'UP' ? 'link-status up' : 'link-status down'}, linkStatus))
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('IP address:')),
			element('td', {className: 'data'}, this.$IPAdress = element('span', {className: ''}, IPAdress === '' ? 'n/a' : IPAdress))
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('Gateway:')),
			element('td', {className: 'data'}, this.$gateway = element('span', {className: ''}, gateway === '' ? 'n/a' : gateway.replace(/\r\n|\r|\n/g, ', ')))
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('DNS server:')),
			element('td', {className: 'data'}, this.$DNSServer = element('span', {className: ''}, DNSServer === '' ? 'n/a' : DNSServer.replace(/\r\n|\r|\n/g, ', ')))
		])
	]);

	CModalAlert.call(this, parent, _('Network info'), elementsArray, _('Cancel'), null);

	this.bpanel.btnRefresh = this.bpanel.Add(KEYS.REFRESH, 'refresh.png', _('Refresh'), function () {
		self.bpanel.Hidden(self.bpanel.btnRefresh, true);
		setTimeout(function () {
			var environmetData = JSON.parse(gSTB.GetEnv(JSON.stringify({varList: ['pppoe_enabled', 'pppoe_login', 'pppoe_dns1']}))),
				linkStatus = gSTB.GetPppoeLinkStatus() ? 'UP' : 'DOWN',
				IPAdress = gSTB.GetPppoeIp(),
				gateway = gSTB.GetNetworkGateways(),
				DNSServer = gSTB.GetNetworkNameServers(),
				currentConfiguration = null;

			if ( environmetData.result.pppoe_enabled === 'true' ) {
				currentConfiguration = environmetData.result.pppoe_login;
			} else {
				currentConfiguration = _('Disabled');
			}

			if (linkStatus === 'UP') {
				self.$linkStatus.className = 'link-status up';
			} else {
				self.$linkStatus.className = 'link-status down';
			}

			self.$currentConfiguration.innerHTML = currentConfiguration;
			self.$linkStatus.innerHTML = linkStatus;
			self.$IPAdress.innerHTML = IPAdress === '' ? 'n/a' : IPAdress;
			self.$gateway.innerHTML = gateway === '' ? 'n/a' : gateway.replace(/\r\n|\r|\n/g, ', ');
			self.$DNSServer.innerHTML = DNSServer === '' ? 'n/a' : DNSServer.replace(/\r\n|\r|\n/g, ', ');
			self.bpanel.Hidden(self.bpanel.btnRefresh, false);
		}, 400);
	});
}

CModalShowPPPoEInfo.prototype = Object.create(CModalAlert.prototype);
CModalShowPPPoEInfo.prototype.constructor = CModalShowPPPoEInfo;


function CModalShowWirelessWiFiInfo ( parent ) {
	var	self = this,
		environmetData = JSON.parse(gSTB.GetEnv(JSON.stringify({varList: ['wifi_ssid', 'wifi_int_ip']}))),
		linkStatus = gSTB.GetWifiLinkStatus() ? 'UP' : 'DOWN',
		MACAdress = gSTB.GetNetworkWifiMac(),
		IPAdress = gSTB.RDir('WiFi_ip'),
		gateway = gSTB.GetNetworkGateways(),
		DNSServer = gSTB.GetNetworkNameServers(),
		currentConfiguration = '"' + environmetData.result.wifi_ssid + '" ( ',
		elementsArray = null;

	if ( cIP(environmetData.result.wifi_int_ip) ) {
		currentConfiguration += _('Static IP') + ')';
	} else {
		currentConfiguration += 'DHCP)';
	}

	elementsArray = element('table', {className: 'main maxw network-info'}, [
		element('tr', {}, [
			element('td', {className: 'name'}, _('Current configuration:')),
			element('td', {className: 'data'}, this.$currentConfiguration = element('span', {className: ''}, currentConfiguration))
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('Link status:')),
			element('td', {className: 'data'}, this.$linkStatus = element('span', {className: linkStatus === 'UP' ? 'link-status up' : 'link-status down'}, linkStatus))
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('MAC address:')),
			element('td', {className: 'data'}, this.$MACAdress = element('span', {className: ''}, MACAdress === '' ? 'n/a' : MACAdress))
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('IP address:')),
			element('td', {className: 'data'}, this.$IPAdress = element('span', {className: ''}, IPAdress === '' ? 'n/a' : IPAdress))
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('Gateway:')),
			element('td', {className: 'data'}, this.$gateway = element('span', {className: ''}, gateway === '' ? 'n/a' : gateway.replace(/\r\n|\r|\n/g, ', ')))
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('DNS server:')),
			element('td', {className: 'data'}, this.$DNSServer = element('span', {className: ''}, DNSServer === '' ? 'n/a' : DNSServer.replace(/\r\n|\r|\n/g, ', ')))
		])
	]);

	CModalAlert.call(this, parent, _('Network info'), elementsArray, _('Cancel'), null);

	this.bpanel.btnRefresh = this.bpanel.Add(KEYS.REFRESH, 'refresh.png', _('Refresh'), function () {
		self.bpanel.Hidden(self.bpanel.btnRefresh, true);
		setTimeout(function () {
			var environmetData = JSON.parse(gSTB.GetEnv(JSON.stringify({varList: ['wifi_ssid', 'wifi_int_ip']}))),
				linkStatus = gSTB.GetWifiLinkStatus() ? 'UP' : 'DOWN',
				MACAdress = gSTB.GetNetworkWifiMac(),
				IPAdress = gSTB.RDir('WiFi_ip'),
				gateway = gSTB.GetNetworkGateways(),
				DNSServer = gSTB.GetNetworkNameServers(),
				currentConfiguration = '"' + environmetData.result.wifi_ssid + '" ( ';

			if ( cIP(environmetData.result.wifi_int_ip) ) {
				currentConfiguration += _('Static IP') + ')';
			} else {
				currentConfiguration += 'DHCP)';
			}

			if (linkStatus === 'UP') {
				self.$linkStatus.className = 'link-status up';
			} else {
				self.$linkStatus.className = 'link-status down';
			}

			self.$currentConfiguration.innerHTML = currentConfiguration;
			self.$linkStatus.innerHTML = linkStatus;
			self.$MACAdress.innerHTML = MACAdress === '' ? 'n/a' : MACAdress;
			self.$IPAdress.innerHTML = IPAdress === '' ? 'n/a' : IPAdress;
			self.$gateway.innerHTML = gateway === '' ? 'n/a' : gateway.replace(/\r\n|\r|\n/g, ', ');
			self.$DNSServer.innerHTML = DNSServer === '' ? 'n/a' : DNSServer.replace(/\r\n|\r|\n/g, ', ');
			self.bpanel.Hidden(self.bpanel.btnRefresh, false);
		}, 400);
	});
}

CModalShowWirelessWiFiInfo.prototype = Object.create(CModalAlert.prototype);
CModalShowWirelessWiFiInfo.prototype.constructor = CModalShowWirelessWiFiInfo;


function CModalPassword ( parent, password ) {
	var self = this,
		html = element('table', {className: 'main maxw'}, [
			element('tr', {}, [
				element('td', {className:'name'}, _('Password:')),
				element('td', {className:'data'}, this.$password = element('input', {type:'password', className:'wide'}))
			])
		]);

	this.onShow = function () {
		stbWindowMgr.SetVirtualKeyboardCoord('bottom');
		setTimeout(function () {
			self.$password.focus();

			// show VK in new mode
			gSTB.ShowVirtualKeyboard();
		}, 0);
	};

	// parent constructor
	CModalAlert.call(this, parent, _('Enter password'), html, _('Cancel'), function () {
		this.Show(false);
		stbStorage.removeItem(getWindowKey(WINDOWS.SYSTEM_SETTINGS));
		stbWebWindow.close();
	});

	// inner name
	this.name = 'CModalPassword';

	// forward events to button panel
	this.EventHandler = function ( event ) {
		if ( !eventPrepare(event, true, self.name) ) {
			return;
		}

		if ( event.stopped === true ) {
			return;
		}

		switch ( event.code ) {
			default:
				// forward events to button panel
				this.bpanel.EventHandler(event);
		}
	};

	// additional button
	this.bpanel.Add(KEYS.OK, 'ok.png', _('Ok'), function () {
		if ( self.$password.value === password ) {
			self.Show(false);
		} else {
			self.$password.value = '';
			new CModalHint(self, _('Wrong password!'), 4000);
		}
	});
}

CModalPassword.prototype = Object.create(CModalAlert.prototype);
CModalPassword.prototype.constructor = CModalPassword;
