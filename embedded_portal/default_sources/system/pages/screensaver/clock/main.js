/**
 * Screen saver 'clock'
 * @author Fedotov Dmytro <comeOn.doYouWantToLiveForever@gmail.com>
 */

'use strict';

// set webkit size
window.moveTo(0, 0);
window.resizeTo(EMULATION ? window.outerWidth : screen.width, EMULATION ? window.outerHeight : screen.height);

// dom is ready
window.onload = function () {
	startRunning();
};

// mouse click
window.onclick = function () {};

// prevent default right-click menu only for releases
window.oncontextmenu = EMULATION ? null : function () {return false;};

function startRunning () {
	var clockSaver = document.createElement('div');
	document.body.appendChild(clockSaver);
	clockSaver.className = 'clock';
	clockSaver.style.top = '100px';
	clockSaver.style.left = '100px';
	// hide keyboard
	gSTB.HideVirtualKeyboard();
	// set screen saver interval
	setInterval(function () {
		run(clockSaver);
	}, 10000);
}

function run ( element ) {
	var date = new Date(),
		minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes(),
		time = date.getHours() + ':' + minutes;

	// set random coordinates for clock element. Set borders to prevent element from cutting
	element.style.top = getRandomInt(100, (WINDOW_HEIGHT - 100)) + 'px';
	element.style.left = getRandomInt(100, (WINDOW_WIDTH - 200)) + 'px';
	element.innerHTML = time;
}

function getRandomInt ( min, max ) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
