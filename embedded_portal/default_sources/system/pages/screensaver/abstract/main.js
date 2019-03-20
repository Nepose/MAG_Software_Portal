/**
 * Screen saver 'abstract'
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

'use strict';

// set webkit size
window.moveTo(0, 0);
window.resizeTo(EMULATION ? window.outerWidth : screen.width, EMULATION ? window.outerHeight : screen.height);

// dom is ready
window.onload = function () {
	canvasApp();
};

// mouse click
window.onclick = function () {};

// prevent default right-click menu only for releases
window.oncontextmenu = EMULATION ? null : function () {return false;};

function canvasApp () {
	var theCanvas = document.createElement('canvas'),
		context = theCanvas.getContext('2d');
	document.body.appendChild(theCanvas);
	theCanvas.width = WINDOW_WIDTH;
	theCanvas.height = WINDOW_HEIGHT;

	init();

	function init () {
		generate();
		setInterval(function () {
			generate();
		}, 1000);
	}

	function setLinePoints ( iterations ) {
		var pointList = {first: {x: 0, y: 1}},
			lastPoint = {x: 1, y: 1},
			minY = 1, maxY = 1, point, nextPoint,
			dx, newX, newY, newPoint, normalizeRate;

		pointList.first.next = lastPoint;
		for ( var i = 0; i < iterations; i++ ) {
			point = pointList.first;
			while ( point.next != null ) {
				nextPoint = point.next;

				dx = nextPoint.x - point.x;
				newX = 0.5 * (point.x + nextPoint.x);
				newY = 0.5 * (point.y + nextPoint.y);
				newY += dx * (Math.random() * 2 - 1);

				newPoint = {x: newX, y: newY};

				// min, max
				if ( newY < minY ) {
					minY = newY;
				} else if ( newY > maxY ) {
					maxY = newY;
				}

				// put between points
				newPoint.next = nextPoint;
				point.next = newPoint;
				point = nextPoint;
			}
		}

		// normalize to values between 0 and 1
		if ( maxY !== minY ) {
			normalizeRate = 1 / (maxY - minY);
			point = pointList.first;
			while ( point != null ) {
				point.y = normalizeRate * (point.y - minY);
				point = point.next;
			}
		} else { // unlikely that max = min, but could happen if using zero iterations. In this case, set all points equal to 1.
			point = pointList.first;
			while ( point !== null ) {
				point.y = 1;
				point = point.next;
			}
		}

		return pointList;
	}

	function generate () {
		var r, g, b, a, centerX, centerY,
			color, maxRad, minRad, phase;

		for ( var i = 0; i < 1; i++ ) {
			maxRad = 50 + Math.random() * 50;
			minRad = 0.88 * maxRad;

			centerX = maxRad + Math.random() * (WINDOW_WIDTH - 2 * maxRad);
			centerY = maxRad + Math.random() * (WINDOW_HEIGHT - 2 * maxRad);

			r = Math.floor(Math.random() * 255);
			g = Math.floor(Math.random() * 255);
			b = Math.floor(Math.random() * 255);
			a = 0.4;
			color = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';

			phase = Math.random() * Math.PI * 2;

			drawCircle(centerX, centerY, minRad, maxRad, phase, color);
		}
	}

	function drawCircle ( centerX, centerY, minRad, maxRad, phase, color ) {
		var twoPi = 2 * Math.PI,
			// generate the random function that will be used to vary the radius, 9 iterations of subdivision
			pointList = setLinePoints(9),
			point, rad, theta, x0, y0;

		context.strokeStyle = color;
		context.lineWidth = 1;
		context.fillStyle = color;
		context.beginPath();
		point = pointList.first;
		theta = phase;
		rad = minRad + point.y * (maxRad - minRad);
		x0 = centerX + rad * Math.cos(theta);
		y0 = centerY + rad * Math.sin(theta);
		context.lineTo(x0, y0);
		while ( point.next != null ) {
			point = point.next;
			theta = twoPi * point.x + phase;
			rad = minRad + point.y * (maxRad - minRad);
			x0 = centerX + rad * Math.cos(theta);
			y0 = centerY + rad * Math.sin(theta);
			context.lineTo(x0, y0);
		}
		context.stroke();
		context.fill();
	}
}
