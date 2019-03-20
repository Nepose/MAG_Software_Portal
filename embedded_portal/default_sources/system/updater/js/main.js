'use strict';

var updateWindow;

window.onload = function () {
	var urlKeys = parseUri(window.location).queryKey,
		language = JSON.parse(gSTB.GetEnv(JSON.stringify({varList: ['language']}))).result.language,
		remoteControlButtonsImagesPath = configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/',
		imageList = ['exit.png', 'ok.png', 'info.png'].map(function ( image ) {
			return remoteControlButtonsImagesPath + image;
		});

	window.moveTo(0, 0);
	window.resizeTo(EMULATION ? window.outerWidth : screen.width, EMULATION ? window.outerHeight : screen.height);

	echo('load update page. urlKeys.CheckVersion:' + urlKeys.CheckVersion + ' with type:' + (typeof urlKeys.CheckVersion));

	gettext.init({name: language, path: 'lang'}, function () {
		var url = urlKeys.url,
			check = Boolean(urlKeys.CheckVersion),
			options = {
				localizations: [
					_('Retry'),
					_('Cancel'),
					_('Show log'),
					_('Hide log'),
					_('Update'),
					_('Update status'),
					_('Check image'),
					_('Exit'),
					_('Current version'),
					_('New version'),
					_('Description'),
					_('Updating to version'),
					_('Update status'),
					_('<span class=\"alert\">Warning!</span> Device will be rebooted after update'),
					_('Change log'),
					_('Information not found'),
					_('Signature init error'),
					_('Wrong device model'),
					_('Section size exceeds partition size on FLASH'),
					_('Required FLASH section not found. Aborting update'),
					_('Updating kernel'),
					_('Updating image'),
					_('Internal error'),
					_('Inspecting firmware'),
					_('Updating environment variables'),
					_('Updating Bootstrap section'),
					_('Skipping Bootstrap section'),
					_('Updating User FS section'),
					_('Skipping User FS section'),
					_('Updating second boot'),
					_('Updating logotype'),
					_('Update finished OK'),
					_('Wrong signature'),
					_('Erasing flash section'),
					_('Flash write error'),
					_('File write error'),
					_('Idle'),
					_('Invalid file header'),
					_('Inspecting update file'),
					_('File check finished'),
					_('File not found'),
					_('Initialising'),
					_('Read error'),
					_('Status'),
					_('Date')
				],
				auto: false,
				update_url: url,
				header_text: _('Autoupdate'),
				log: true,
				events: {
					onStart: function () {
						echo('updater.js: onStart listener, this.isVisible:' + this.isVisible);
						if ( this.isVisible === false ) {
							echo('updater.js => update window show.');
							this.UpdateStart();
							this.Show(true);
							stbWindowMgr.windowShow(stbWebWindow.windowId());
							stbWebWindow.messageSend(getWindowIdByName(WINDOWS.PORTAL) || 1, 'AutoUpdateWindow:opened', '');
							echo('updater.js => update window showed.');
						}
					},
					onReady: function () {
						var currImgDate = this.curr_info.date.getTime(),
							newImgDate  = this.image_info.date.getTime();

						echo('updater.js: onReady listener');
						echo('check: ' + check);
						echo('newImgDate :' + newImgDate);
						echo('currImgDate:' + currImgDate);
						if ( check === false || (check === true && (isNaN(currImgDate) || newImgDate > currImgDate)) ) {
							echo('updater.js => need update');
							this.Update.Start(this.update_url);
						} else {
							echo('updater.js => device is ready. no need for update. close itself.');
							stbWebWindow.messageSend(getWindowIdByName(WINDOWS.PORTAL) || 1, 'AutoUpdateWindow:closed', '');
							stbWebWindow.close();
						}
					},
					onError: function () {
						echo('updater.js => onError listener.');
						if ( this.isVisible === false ) {
							echo('updater.js => error happened. close update window.');
							stbWebWindow.messageSend(getWindowIdByName(WINDOWS.PORTAL) || 1, 'AutoUpdateWindow:closed', '');
							stbWebWindow.close();
						}
					},
					onHide: function () {
						echo('updater.js: onHide listener => normal update window close.');
						stbWebWindow.messageSend(getWindowIdByName(WINDOWS.PORTAL) || 1, 'AutoUpdateWindow:closed', '');
						stbWebWindow.close();
					}
				}
			};

		updateWindow = new CUpdateModal(document.body, options);

		updateWindow.Update.bind({
			onStart: function () {
				echo('updater.js: onStart listener');
				echo('is this.isVisible:' + updateWindow.isVisible);
				if ( updateWindow.isVisible === false ) {
					echo('updater.js => update window show.');
					updateWindow.UpdateStart();
					updateWindow.Show(true);
				}
				stbWindowMgr.windowShow(stbWebWindow.windowId());
				stbWebWindow.messageSend(getWindowIdByName(WINDOWS.PORTAL) || 1, 'AutoUpdateWindow:opened', '');
				echo('updater.js => update window showed.');
			}
		});

		imageLoader(imageList, function () {
			if ( urlKeys.url.indexOf('igmp://') !== -1 ) {
				echo('updater.js: multicast update request has been found. Show loader.');
				updateWindow.Show(true);
				stbWindowMgr.windowShow(stbWebWindow.windowId());
			}
			updateWindow.Update.CheckUpdate(url);
		});
	});

	document.body.onkeydown = function ( event ) {
		updateWindow.EventHandler(event);
	};
};
