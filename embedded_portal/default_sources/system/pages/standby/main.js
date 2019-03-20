'use strict';

var mainPage, showInterfaceTimer, countDownTimer, messageReceived,
	environment       = JSON.parse(gSTB.GetEnv(JSON.stringify({varList: ['language', 'standByMode', 'autoPowerDownTime']}))).result,
	language          = environment.language,
	autoPowerDownTime = environment.autoPowerDownTime,
	standByMode       = parseInt(environment.standByMode, 10),
	stbEvent          = {
		onEvent: function ( data ) { },
		onBroadcastMessage: function ( from, message, data ) {},
		onMessage: function ( from, message, data ) {
			echo('apd got message with data');
			echo(JSON.stringify(arguments));

			if ( message === 'player.timeshift.status' ) {
				if ( data === 'true' ) {
					// timeshift is active so stop apd and close apd window
					window.clearTimeout(showInterfaceTimer);
					echo('close itself');
					stbWebWindow.close();
				} else if ( data === 'false' ) {
					window.clearTimeout(showInterfaceTimer);
					showInterface();
				}
			}
		},
		event: 0
	};


function showInterface () {
	echo('showInterface');
	window.clearTimeout(showInterfaceTimer);
	// show this window (it can be hidden)
	stbWindowMgr.windowShow(stbWebWindow.windowId());
	gettext.init({name: language, path: 'lang'}, function () {
		echo('apd-> lang loaded');
		var text1    = _('Device will be shut down in '),
			text2    = _(' seconds.<br>Press any key to cancel.'),
			timeLeft = 59;

		mainPage = new CPage();
		mainPage.name = 'main';
		window.currCPage = window.ServiceMenu = mainPage;
		mainPage.Init(document.body.children[0]);
		mainPage.Show(true);
		mainPage.messageHint = new CModalHint(mainPage, text1 + timeLeft + text2, null, true);
		(function countDown () {
			echo('apd-> timeLeft:' + timeLeft);
			timeLeft--;
			mainPage.messageHint.content.innerHTML = text1 + timeLeft + text2;
			if ( timeLeft > 0 ) {
				countDownTimer = window.setTimeout(countDown, 1000);
			} else {
				standByTrigger();
			}
		})();
		mainPage.messageHint.Show(true);
	});
}


function standByTrigger () {
	var standByStatus = !gSTB.GetStandByStatus();

	// check stand by mode trigger
	if ( gSTB.StandByMode !== standByMode ) { gSTB.StandByMode = standByMode; }

	// deep standBy mode
	if ( standByMode === 3 ) {
		echo('apd-> go to deep');
		document.body.style.display = 'none';
		stbWindowMgr.hideWindow(stbWebWindow.windowId()); // hide itself
		setTimeout(function () {
			gSTB.SetLedIndicatorMode(2);
			gSTB.StandBy(standByStatus);
			gSTB.SetLedIndicatorMode(1);
			echo('apd-> exit from deep');
			stbWebWindow.close(); // close itself
		}, 500); // need some time to hide apd window
		return;
	}

	// active standBy mode
	if ( standByStatus ) {
		echo('apd-> Go to active');
		document.body.style.display = 'none';
		stbWindowMgr.hideWindow(stbWebWindow.windowId());
		gSTB.SetLedIndicatorMode(2);
		gSTB.StandBy(standByStatus);
		gSTB.Stop();
	} else {
		echo('apd-> wake up from active and close itself');
		gSTB.StandBy(standByStatus);
		gSTB.SetLedIndicatorMode(1);
		stbWebWindow.close();
	}
}

// APD turned off by user so close this apd window
if ( !autoPowerDownTime || autoPowerDownTime === '0' ) {
	echo('apd-> option turned off, stop and close itself');
	stbWebWindow.close();
}

// hide this window and wait
stbWindowMgr.hideWindow(stbWebWindow.windowId());


window.onload = function () {
	window.resizeTo(EMULATION ? window.outerWidth : screen.width, EMULATION ? window.outerHeight : screen.height);
	window.moveTo(0, 0);
	echo('apd-> window created with id: ' + stbWebWindow.windowId());

	// player have 5 seconds to answer otherwise show apd window
	showInterfaceTimer = window.setTimeout(function () {
		showInterface();
	}, 5000);

	messageReceived = stbWebWindow.messageSend(1, 'player.timeshift.status', '');
	echo('messageResived? ' + messageReceived);
	if ( !messageReceived ) {
		// nobody listen messages in portal window so start stand alone mode immediately
		window.clearTimeout(showInterfaceTimer);
		showInterface();
	}

	document.addEventListener('keydown', function ( event ) {
		echo('apd-> key pressed, filtering');
		// get real key code or exit
		if ( !eventPrepare(event, false, window.currCPage && window.currCPage.name) ) { return;}
		// global events
		echo('apd-> key filtered. is it power in turned active standby?' + (event.code === KEYS.POWER) + '&&' + (standByMode !== 3) + '&&' + gSTB.GetStandByStatus());
		if ( event.code === KEYS.POWER && standByMode !== 3 && gSTB.GetStandByStatus() ) {
			standByTrigger();
		} else {
			echo('apd-> key pressed, stop timer, close itself');
			// standby cancelled, close itself
			window.clearTimeout(countDownTimer);
			stbWebWindow.close();
		}
	});
};
