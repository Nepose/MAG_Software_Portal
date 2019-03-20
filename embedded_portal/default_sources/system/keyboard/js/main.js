'use strict';

/* jshint unused:false */

var main_lang = getCurrentLanguage(),
	modes = {/*wigth: 0,*/ height: 0, put: 0},
	popup = false,
	popupBlock = null,     // placeholder
	keyboardBlock = null,  // placeholder
	position = {x: 0, y: 0, w: 0, h: 0, m: 0, p: 0},
	popupMarg = {
		'576' : {
			left  : 17,
			top   : 22,
			width : 80,
			height: 81,
			bodyW : 578,
			bodyH : 198
		},
		'720' : {
			left  : 32,
			top   : 40,
			width : 131,
			height: 133,
			bodyW : 846,
			bodyH : 311
		},
		'1080': {
			left  : 48,
			top   : 60,
			width : 199,
			height: 202,
			bodyW : 1269,
			bodyH : 467
		}
	},
	langv = '',
	butDisable = true,
	butFlag = {
		shift    : false,
		caps     : false,
		upper    : 'lower',
		upperSend: 'lSend'
	},
	variation = {
		1: [1],
		2: [2, 2],
		3: [2, 4, 4],
		4: [4, 4, 4, 4]
	},
	remoteControlButtonsImagesPath = WINDOW_WIDTH > 720 ? (configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/') : (configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'keyboard/new/' : PATH_IMG_SYSTEM + 'keyboard/old/');

var stbEvent = {
	onVkNeedReposition : function ( type ) {
		if ( !type ) {
			var input = JSON.parse(stbWindowMgr.GetFocusedInputInfo());
			position.y = parseInt(input.result.y, 10);
			position.inputH = parseInt(input.result.h, 10);
			type = input.result.positionHint;
		}
		switch ( type ) {
			case 'none':
				if ( (position.y + position.h + position.p + position.inputH + position.m) > modes.height ) {
					position.y = position.y - position.m - position.h;
				}
				else {
					position.y = position.y + position.m + position.inputH;
				}
				break;
			case 'topleft':
			case 'topright':
			case 'top':
				position.y = position.p;
				break;
			case 'bottomleft':
			case 'bottomright':
			case 'bottom':
				position.y = modes.height - position.p - position.h;
				break;
		}
		stbWebWindow.SetGeometry(position.x, position.y, position.w, position.h);
	}
};


window.onkeydown = function ( e ) {
	var ec = e.keyCode;
	e.preventDefault();

	if ( butDisable && (ec !== 76 || ec !== 27) ) {
		return;
	}

	if ( ec === 85 && e.altKey ) {
		send_text('power', ec);
		navigation.exit();
		return;
	}

	if ( popup ) {
		switch ( ec ) {
			case 27:
			case 76:
				navigation.exit();
				break;
			case 13:
				navigation.elements[navigation.y][navigation.x].className += ' active';
				popup = false;
				popupBlock.style.display = 'none';
				break;
			case 39:
				popupBlock.getElementsByClassName('right')[0].className = 'right act';
				navigation.popup('right');
				break;
			case 37:
				popupBlock.getElementsByClassName('left')[0].className = 'left act';
				navigation.popup('left');
				break;
			case 38:
				popupBlock.getElementsByClassName('top')[0].className = 'top act';
				navigation.popup('up');
				break;
			case 40:
				popupBlock.getElementsByClassName('bottom')[0].className = 'bottom act';
				navigation.popup('down');
				break;
		}
	} else
		switch ( ec ) {
			case 8:
				back();
				break;
			case 27:
			case 76:
				navigation.exit();
				break;
			case 13:
				navigation.ok();
				break;
			case 39:
				navigation.horisontal(1);
				break;
			case 37:
				navigation.horisontal(-1);
				break;
			case 38:
				navigation.vertical(-1);
				break;
			case 40:
				navigation.vertical(1);
				break;
			case 49:
				send_text('1');
				break;
			case 50:
				send_text('2');
				break;
			case 51:
				send_text('3');
				break;
			case 52:
				send_text('4');
				break;
			case 53:
				send_text('5');
				break;
			case 54:
				send_text('6');
				break;
			case 55:
				send_text('7');
				break;
			case 56:
				send_text('8');
				break;
			case 57:
				send_text('9');
				break;
			case 48:
				send_text('0');
				break;
			case 89:
				enter();
				break;
			case 112:
				space();
				break;
			case 113:
				caps();
				break;
			case 114:
				shift();
				break;
			case 115:
				langv_change();
				break;
		}
};


window.onload = function () {
	var keyboardFile = gSTB.LoadUserData('keyboard.json'),
		i;

	if ( keyboardFile ) {
		try {
			keyboardFile = JSON.parse(keyboardFile);
		} catch ( error ) {
			keyboardFile = {layouts: [], order: []};

			for ( i = 0; i < keyboards[main_lang][keyboards.index].length; i++ ) {
				if ( keyboardFile.layouts.indexOf(keyboards[main_lang][keyboards.index][i]) === -1 ) {
					keyboardFile.layouts.push(keyboards[main_lang][keyboards.index][i]);
					keyboardFile.order.push(keyboards[main_lang][keyboards.index][i]);
				}
			}

			for ( i = 0; i < keyboards.codes.length; i++ ) {
				if ( keyboardFile.layouts.indexOf(keyboards.codes[i]) === -1 ) {
					keyboardFile.order.push(keyboards.codes[i]);
				}
			}

			gSTB.SaveUserData('keyboard.json', JSON.stringify(keyboardFile));
		}

		if ( keyboardFile.layouts && keyboardFile.layouts.length > 0 ) {
			for ( i = 0; i < keyboardFile.layouts.length; i++ ) {
				if ( keyboards.codes.indexOf(keyboardFile.layouts[i]) === -1 ) {
					keyboardFile.layouts.splice(i, 1);
				}
			}

			if ( keyboardFile.layouts.length > 0 ) {
				keyboards[main_lang] = [];

				for ( i = 0; i < keyboardFile.layouts.length; i++ ) {
					if ( i === (keyboardFile.layouts.length - 1) ) {
						keyboards[main_lang][keyboards[main_lang].length] = [keyboardFile.layouts[i], keyboardFile.layouts[0]];
					} else {
						keyboards[main_lang][keyboards[main_lang].length] = [keyboardFile.layouts[i], keyboardFile.layouts[i + 1]];
					}
				}

				keyboards.index = 0;
			}
		}
	}



	// warming up and exit
	if ( URL_PARAMS.load ) {
		return warmUp();
	}
	var a, w, h, padding, margin,
		alpha = {
			'576' : 74,
			'720' : 217,
			'1080': 325
		};

	popupBlock = document.getElementById('popup');
	keyboardBlock = document.getElementById('keyboard');

	keyboards.index = 0;
	navigation.x = 6;
	navigation.y = 2;
	generate_html();
	var input = JSON.parse(stbWindowMgr.GetFocusedInputInfo());
	position.y = parseInt(input.result.y, 10);
	position.inputH = parseInt(input.result.h, 10);
	modes.height = WINDOW_HEIGHT;
	switch ( modes.height ) {
		case 480:
		case 576:
			modes.put = 576;
			w = 578;
			h = 198;
			margin = 10;
			padding = 20;
			break;
		case 720:
			modes.put = 720;
			w = 846;
			h = 311;
			margin = 10;
			padding = 20;
			break;
		case 1080:
			modes.put = 1080;
			w = 1269;
			h = 467;
			margin = 15;
			padding = 30;
			break;
	}

	a = alpha[modes.put];
	position.x = a;
	position.w = w;
	position.h = h;
	position.m = margin;
	position.p = padding;
	stbEvent.onVkNeedReposition(input.result.positionHint);

	if ( configuration.newRemoteControl ) {
		document.querySelector('ul.buttons li.backspace .symbol').style.backgroundImage = 'url(' + remoteControlButtonsImagesPath + 'back.png)';
		document.querySelector('ul.buttons li.enter .symbol').style.backgroundImage = 'url(' + remoteControlButtonsImagesPath + 'info.png)';
	}
};


function XOR ( a, b ) {
	return (a || b) && !(a && b);
}


var navigation = {
	timer       : {},
	x           : 0,
	y           : 0,
	elements    : [],
	oldClass    : '',
	exit        : function () {
		stbWebWindow.close();
	},
	ok          : function () {
		switch ( board[langv][this.y][this.x].type ) {
			case 'sendtext':
			case 'send':
				send_text(board[langv][this.y][this.x][butFlag.upperSend]);
				if ( butFlag.shift ) {
					shift();
				}
				break;
			case 'func':
				board[langv][this.y][this.x].func();
				break;
			case 'spec':
				var body = popupBlock.getElementsByTagName('div');
				var x = this.elements[this.y][this.x].offsetLeft - popupMarg[modes.put].left;
				var y = this.elements[this.y][this.x].offsetTop - popupMarg[modes.put].top;
				var b = board[langv][this.y][this.x][butFlag.upper].length;
				this.elements[this.y][this.x].className = this.oldClass;
				if ( x < 10 ) {
					x = 10;
				} else if ( x + popupMarg[modes.put].width + 10 > popupMarg[modes.put].bodyW ) {
					x = popupMarg[modes.put].bodyW - popupMarg[modes.put].width - 10;
				}
				if ( y < 10 ) {
					y = 10;
				} else if ( y + popupMarg[modes.put].height + 10 > popupMarg[modes.put].bodyH ) {
					y = popupMarg[modes.put].bodyH - popupMarg[modes.put].height - 10;
				}
				body[0].className = 'top';
				body[1].className = 'left';
				body[2].className = 'right';
				body[3].className = 'bottom';
				body[4].className = 'ok act';
				switch ( b ) {
					case 2:
						body[1].innerHTML = board[langv][this.y][this.x][butFlag.upper][0];
						body[1].style.display = 'block';
						body[2].innerHTML = board[langv][this.y][this.x][butFlag.upper][1];
						body[2].style.display = 'block';
						body[0].style.display = 'none';
						body[3].style.display = 'none';
						break;
					default:
						for ( var i = 0; i < 4; i++ ) {
							if ( i < b ) {
								body[i].innerHTML = board[langv][this.y][this.x][butFlag.upper][i];
								body[i].style.display = 'block';
							}
							else {
								body[i].style.display = 'none';
							}
						}
						break;
				}
				popupBlock.style.marginTop = y + 'px';
				popupBlock.style.marginLeft = x + 'px';
				popup = true;
				popupBlock.style.display = 'block';
				break;
		}
		if ( this.timer ) {
			clearTimeout(this.timer);
			this.elements[this.y][this.x].className = this.elements[this.y][this.x].className.replace(' sended', '');
		}
		this.elements[this.y][this.x].className += ' sended';
		this.timer = setTimeout(function () {
			navigation.elements[navigation.y][navigation.x].className = navigation.elements[navigation.y][navigation.x].className.replace(' sended', '');
		}, 500);
	},
	vertical  : function ( a ) {
		var i, langv = keyboards[main_lang][keyboards.index][0];
		this.elements[this.y][this.x].className = this.oldClass;
		var widht1 = 0,
			widht2 = 0;
		for ( i = 0; i < this.x; i++ ) {
			widht1 += board[langv][this.y][i].width;
		}
		widht1 += (board[langv][this.y][this.x].width / 2);
		this.y += a;
		if ( this.y < 0 ) {
			this.y = this.elements.length - 1;
		}
		else if ( this.y >= this.elements.length ) {
			this.y = 0;
		}
		for ( i = 0; i < this.elements[this.y].length; i++ ) {
			widht2 += board[langv][this.y][i].width;
			if ( widht2 >= widht1 ) {
				this.x = i;
				break;
			}
		}
		this.oldClass = this.elements[this.y][this.x].className;
		this.elements[this.y][this.x].className = this.oldClass + ' active';
	},
	horisontal: function ( a ) {
		this.elements[this.y][this.x].className = this.oldClass;
		this.x += a;
		if ( this.x < 0 ) {
			this.x = this.elements[this.y].length - 1;
		}
		else if ( this.x >= this.elements[this.y].length ) {
			this.x = 0;
		}
		this.oldClass = this.elements[this.y][this.x].className;
		this.elements[this.y][this.x].className = this.oldClass + ' active';
	},
	popup     : function ( a ) {
		var b = board[langv][this.y][this.x][butFlag.upperSend].length;
		switch ( a ) {
			case 'up':
				if ( b > 2 ) {
					send_text(board[langv][this.y][this.x][butFlag.upperSend][0]);
					setTimeout(function () {
						popupBlock.style.display = 'none';
						navigation.elements[navigation.y][navigation.x].className += ' active';
					}, 150);
					popupBlock.getElementsByClassName('ok')[0].className = 'ok';
					popup = false;
				}
				break;
			case 'down':
				if ( b > 3 ) {
					send_text(board[langv][this.y][this.x][butFlag.upperSend][3]);
					setTimeout(function () {
						popupBlock.style.display = 'none';
						navigation.elements[navigation.y][navigation.x].className += ' active';
					}, 150);
					popupBlock.getElementsByClassName('ok')[0].className = 'ok';
					popup = false;
				}
				break;
			case 'left':
				if ( b <= 2 ) {
					send_text(board[langv][this.y][this.x][butFlag.upperSend][0]);
					setTimeout(function () {
						popupBlock.style.display = 'none';
						navigation.elements[navigation.y][navigation.x].className += ' active';
					}, 150);
					popupBlock.getElementsByClassName('ok')[0].className = 'ok';
					popup = false;
				}
				else {
					send_text(board[langv][this.y][this.x][butFlag.upperSend][1]);
					setTimeout(function () {
						popupBlock.style.display = 'none';
						navigation.elements[navigation.y][navigation.x].className += ' active';
					}, 150);
					popupBlock.getElementsByClassName('ok')[0].className = 'ok';
					popup = false;
				}
				break;
			case 'right':
				if ( b <= 2 ) {
					send_text(board[langv][this.y][this.x][butFlag.upperSend][1]);
					setTimeout(function () {
						popupBlock.style.display = 'none';
						navigation.elements[navigation.y][navigation.x].className += ' active';
					}, 150);
					popupBlock.getElementsByClassName('ok')[0].className = 'ok';
					popup = false;
				}
				else {
					send_text(board[langv][this.y][this.x][butFlag.upperSend][2]);
					setTimeout(function () {
						popupBlock.style.display = 'none';
						navigation.elements[navigation.y][navigation.x].className += ' active';
					}, 150);
					popupBlock.getElementsByClassName('ok')[0].className = 'ok';
					popup = false;
				}
				break;
		}
	}
};


function send_text ( text, id ) {
	if ( !id ) {
		id = 0;
	}
	stbWebWindow.SendVirtualKeypress(text, id);
}


function enter () {
	send_text('Enter', 13);
}


function back () {
	send_text('BackSpace', 8);
}


function space () {
	send_text('Space', 0);
}


function shift () {
	butFlag.shift = !butFlag.shift;
	refresh();
}


function caps () {
	butFlag.caps = !butFlag.caps;
	refresh();
}


function send_button () {
	switch ( board[langv][navigation.y][navigation.x].lSend ) {
		case 'up':
			send_text('Up', 38);
			break;
		case 'down':
			send_text('Down', 40);
			break;
		case 'left':
			send_text('Left', 37);
			break;
		case 'right':
			send_text('Right', 39);
			break;
	}
}


function langv_change () {
	var langv = keyboards[main_lang][keyboards.index][1],
		i;

	for ( i = 0; i < keyboards[main_lang].length; i++ ) {
		if ( langv === keyboards[main_lang][i][0] ) {
			if ( keyboards.index !== i ) {
				keyboards.index = i;
				refresh();
			}

			break;
		}
	}
}


function warmUp () {
	var imageList = ['f1.png', 'f2.png', 'f3.png', 'f4.png', 'back.png', 'info.png'].map(function(image) {
		return remoteControlButtonsImagesPath + image;
	});

	imageList = imageList.concat(['arrow_down.png', 'arrow_down_focus.png', 'arrow_left.png', 'arrow_left_focus.png', 'arrow_right.png', 'arrow_right_focus.png', 'arrow_up.png', 'arrow_up_focus.png', 'popup.png', 'popup_bottom.png', 'popup_bottom_focus.png', 'popup_left.png', 'popup_left_focus.png', 'popup_ok.png', 'popup_ok_focus.png', 'popup_right.png', 'popup_right_focus.png', 'popup_top.png', 'popup_top_focus.png'].map(function(image) {
		return PATH_IMG_SYSTEM + 'keyboard/' + image;
	}));

	imageLoader(imageList, function() {
		navigation.exit();
	});
}


function generate_html () {
	langv = keyboards[main_lang][keyboards.index][0];
	elclear(keyboardBlock);
	butFlag.upper = (XOR(butFlag.shift, butFlag.caps) && (butFlag.caps || butFlag.shift)) ? 'upper' : 'lower';
	butFlag.upperSend = (XOR(butFlag.shift, butFlag.caps) && (butFlag.caps || butFlag.shift)) ? 'upSend' : 'lSend';
	var attr;
	var ul1 = element('ul', {className: 'buttons spacer'});
	var ul2 = element('ul', {className: 'buttons'});
	var divB = element('div', {className: 'clear spacer'});
	for ( var y = 0; y < 5; y++ ) {
		navigation.elements[y] = [];
		var div, obj = [];
		for ( var x = 0; x < board[langv][y].length; x++ ) {
			//data = board[langv][y][x][butFlag.upper];
			switch ( board[langv][y][x].type ) {
				case 'spec':
					var b = board[langv][y][x][butFlag.upper].length;
					div = [];
					for ( var j = 0; j < b; j++ ) {
						div[j] = element('div', {className: 'symbol' + variation[b][j]});
						div[j].innerHTML = board[langv][y][x][butFlag.upper][j];
					}
					break;
				case 'sendtext':
					div = element('div', {className: 'com'});
					div.innerHTML = board[langv][y][x][butFlag.upper];
					break;
				default :
					if ( board[langv][y][x].width > 1 ) {
						div = element('div', {className: 'symbol'});
						div.innerHTML = board[langv][y][x][butFlag.upper];
						break;
					}
					div = element('div', {className: 'symbol1'});
					div.innerHTML = board[langv][y][x][butFlag.upper];
					break;
			}
			attr = {className: board[langv][y][x]['class'], x: x, y: y, onmouseover: mouse_over, 'onclick': mouse_click};
			obj[x] = element('li', attr, div);
			navigation.elements[y][x] = obj[x];
		}

		if ( y === 0 ) {
			elchild(ul1, obj);
		} else {
			elchild(ul2, obj);
		}
	}
	elchild(keyboardBlock, ul1);
	elchild(keyboardBlock, divB);
	elchild(keyboardBlock, ul2);
	keyboardBlock.style.display = 'block';
	navigation.oldClass = navigation.elements[navigation.y][navigation.x].className;
	navigation.elements[navigation.y][navigation.x].className = navigation.oldClass + ' active';
	document.getElementsByClassName('lang')[0].getElementsByTagName('div')[0].innerHTML = langTitles[keyboards[main_lang][keyboards.index][0]];
	butDisable = false;
}


function refresh () {
	var div;
	butDisable = true;
	keyboardBlock.style.display = 'none';
	navigation.elements[navigation.y][navigation.x].className = navigation.oldClass;
	langv = keyboards[main_lang][keyboards.index][0];
	butFlag.upper = (XOR(butFlag.shift, butFlag.caps) && (butFlag.caps || butFlag.shift)) ? 'upper' : 'lower';
	butFlag.upperSend = (XOR(butFlag.shift, butFlag.caps) && (butFlag.caps || butFlag.shift)) ? 'upSend' : 'lSend';
	for ( var y = 0; y < 5; y++ ) {
		for ( var x = 0; x < board[langv][y].length; x++ ) {
			switch ( board[langv][y][x].type ) {
				case 'spec':
					var b = board[langv][y][x][butFlag.upper].length;
					div = [];
					for ( var j = 0; j < b; j++ ) {
						div[j] = element('div', {className: 'symbol' + variation[b][j]});
						div[j].innerHTML = board[langv][y][x][butFlag.upper][j];
					}
					break;
				case 'sendtext':
					div = element('div', {className: 'com'});
					div.innerHTML = board[langv][y][x][butFlag.upper];
					break;
				default :
					if ( board[langv][y][x].width > 1 ) {
						div = element('div', {className: 'symbol'});
						div.innerHTML = board[langv][y][x][butFlag.upper];
						break;
					}
					div = element('div', {className: 'symbol1'});
					div.innerHTML = board[langv][y][x][butFlag.upper];
					break;
			}
			elclear(navigation.elements[y][x]);
			navigation.elements[y][x].className = board[langv][y][x]['class'];
			elchild(navigation.elements[y][x], div);
		}
	}
	if ( butFlag.shift ) {
		document.getElementsByClassName('shift')[0].className += ' pressed';
	}
	if ( butFlag.caps ) {
		document.getElementsByClassName('caps')[0].className += ' pressed';
	}
	navigation.oldClass = navigation.elements[navigation.y][navigation.x].className;
	navigation.elements[navigation.y][navigation.x].className = navigation.oldClass + ' active';
	document.getElementsByClassName('lang')[0].getElementsByTagName('div')[0].innerHTML = langTitles[keyboards[main_lang][keyboards.index][0]];
	keyboardBlock.style.display = 'block';
	butDisable = false;

	if ( configuration.newRemoteControl ) {
		document.querySelector('ul.buttons li.backspace .symbol').style.backgroundImage = 'url(' + remoteControlButtonsImagesPath + 'back.png)';
		document.querySelector('ul.buttons li.enter .symbol').style.backgroundImage = 'url(' + remoteControlButtonsImagesPath + 'info.png)';
	}
}


function mouse_click () {
	/*jshint validthis: true */

	if ( !popup ) {
		navigation.y = this.y;
		navigation.x = this.x;
		navigation.ok();
	}
}


function mouse_over () {
	/*jshint validthis: true */

	if ( !popup ) {
		navigation.elements[navigation.y][navigation.x].className = navigation.oldClass;
		navigation.y = this.y;
		navigation.x = this.x;
		navigation.oldClass = navigation.elements[navigation.y][navigation.x].className;
		navigation.elements[navigation.y][navigation.x].className = navigation.oldClass + ' active';
	}
}


function popup_over ( a ) {
	if ( popup ) {
		var b = document.getElementById('popup').getElementsByTagName('div');
		b[0].className = 'top';
		b[1].className = 'left';
		b[2].className = 'right';
		b[3].className = 'bottom';
		b[4].className = 'ok';
		b[a].className += ' act';
	}
}


function popup_ok () {
	navigation.elements[navigation.y][navigation.x].className += ' active';
	popup = false;
	popupBlock.style.display = 'none';
}
