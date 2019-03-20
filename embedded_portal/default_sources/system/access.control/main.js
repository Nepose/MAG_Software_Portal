/**
 * Acces control
 * @author Roman Stoian
 */

'use strict';

var accessControl = (function () {
	var env;

	function CModalAccessControl ( ok, exit, noExit ) {
		var self = this,
			html = element('table', {className:'main maxw'}, [
				element('tr', {}, [
					element('td', {className:'name'}, _('Password')),
					element('td', {className:'data'}, this.pass = element('input', {type:'password'}))
				])
			]);

		this.pass.onkeydown = function ( event ) {
			// get real key code or exit
			if ( !eventPrepare(event, false, 'CModalAccessControl') ) {
				return;
			}
			switch ( event.code ) {
				case KEYS.CHANNEL_NEXT: // channel+
				case KEYS.CHANNEL_PREV: // channel-
					event.preventDefault(); // to suppress tabbing
					break;
				case KEYS.UP: // up
				case KEYS.DOWN: // down
					break;
				case KEYS.OK: // enter
					break;
			}
		};

		this.onShow = function(){
			setTimeout(function(){
				self.pass.focus();
			}, 5);
		};

		// parent constructor
		CModalAlert.call(this, accessControl.parent || currCPage, _('Unlock'), html, _('Cancel'), exit);

		this.focusList.push(this.pass);


		this.onHide = function(){
			elclear(self.bpanel.handle);
			delete self.bpanel;
			self.Free();
			gSTB.EnableAppButton(true);
		};


		/**
		 * The component inner name
		 * @type {string}
		 */
		this.name = 'CModalAccessControl';

		// additional button
		this.bpanel.Add(KEYS.OK, 'ok.png', _('Ok'), function () {
			if ( accessControl.login(self.pass.value) ) {
				self.Show(false);
				gSTB.EnableAppButton(true);
				if ( typeof ok === 'function' ) {
					ok();
				}
			}
		});

		if ( noExit ) {
			this.bpanel.Hidden(this.bpanel.btnExit, true);
		}

	}

	CModalAccessControl.prototype = Object.create(CModalAlert.prototype);
	CModalAccessControl.prototype.constructor = CModalAccessControl;

	function CModalAccessControlLogOut ( portals ) {
		var self = this,
			text;

		if ( portals ) {
			text = _('Lock device or exit portal?');
		} else {
			text = _('Lock device?');
		}
		// parent constructor
		CModalAlert.call(this, accessControl.parent || currCPage, _('Confirm'), text, _('Cancel'));

		this.focusList.push(this.pass);

		/**
		 * The component inner name
		 * @type {string}
		 */
		this.name = 'CModalAccessControlLogOut';

		// additional button
		this.bpanel.Add(KEYS.OK, 'ok.png', _('Lock'), function () {
			accessControl.logout();
			self.Show(false);
			accessControl.showLoginForm(null, null, accessControl.data.events.portalOpen);
		});

		if ( portals ) {
			this.bpanel.Add(KEYS.BACK, 'back.png', _('Exit portal'), function () {
				accessControl.logout();
				window.location = PATH_SYSTEM + 'pages/loader/index.html';
			});
		}
	}

	CModalAccessControlLogOut.prototype = Object.create(CModalAlert.prototype);
	CModalAccessControlLogOut.prototype.constructor = CModalAccessControlLogOut;

	return {
		state: false,
		password: null,
		loginForm: null,
		data: {pages:{},events:{}},
		login: function ( password, noEvent ) {
			if ( password !== this.password ) {
				 //this.state = true;
				 return false;
			}
			this.state = false;
			stbStorage.setItem('accessControl', this.state);
			if ( !noEvent ) {
				stbWebWindow.messageBroadcast('accessControl', this.state);
			}
			return true;
		},
		logout: function () {
			this.password = env.acPassword;
			if ( env.accessControl ) {
			 	this.state = true;
			} else {
			 	this.state = false;
			}
			stbWebWindow.messageBroadcast('accessControl', this.state);
			stbStorage.setItem('accessControl', this.state);
		},
		showLoginForm: function ( ok, exit, noExit ) {
			gSTB.EnableAppButton(false);
			this.loginForm = new CModalAccessControl(ok, exit, noExit);
			return this.loginForm;
		},
		showLogoutForm: function ( portals ) {
			return new CModalAccessControlLogOut(portals);
		},
		init: function ( parent ) {
			var text, stb,
				self = this;

			if ( window.environment ) {
				env = environment;
			} else {
				try {
					env = JSON.parse(gSTB.GetEnv(JSON.stringify({ varList : [
						'acPassword', 'accessControl'
					]}))).result;
					env.accessControl = env.accessControl === 'true' ? true : false;
				} catch (e) {
					echo(e, 'Environment load');
					env = {};
				}
			}

			stbEvent.bind('broadcast.accessControl', function ( data ) {
				echo(data.data, 'broadcast.accessControl');
				if ( self.loginForm ) {
					self.loginForm.Show(false);
				}
				self.state = data.data === 'true';
			});

			this.parent = parent;
			try {
				text = gSTB.LoadUserData('access.control.json');
				if ( text !== '' ) {
					this.data = JSON.parse(text);
				}
			} catch (e) {
				echo(e, 'AccessControl parse');
			}
			if ( stbStorage.getItem('accessControl') ) {
				stb = stbStorage.getItem('accessControl') === 'false';
			}
			env.acPassword = env.acPassword || '';
			if ( env.accessControl ) {
				this.state = stb? false: true;
				this.password = env.acPassword;
			}
			stbStorage.setItem('accessControl', this.state);
		},
		save: function () {
			gSTB.SaveUserData('access.control.json',JSON.stringify(this.data));
		}
	};
})();
