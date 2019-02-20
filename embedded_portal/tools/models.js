/**
 *
 * @author Aleynikov Boris <aleynikov.boris@gmail.com>.
 */

var path = require('path'),
	fs = require('fs'),
	configPath = path.join(process.cwd(), '..', 'public', 'config.js'),

	//
	configuration = {},
	PATH_IMG_PUBLIC ='',
	PATH_SYSTEM = ''
	;

Array.prototype.shuffle = function () {
	var n = this.length,
		i, tmp;
	while ( n-- ) {
		i   = Math.floor(n * Math.random());
		tmp = this[i];
		this[i] = this[n];
		this[n] = tmp;

	}
	return this;
};

function extend (target, source, override) {
	var _target = (override === false ? extend({}, target) : target || {});
	for (var prop in source) {
		if ( typeof _target[prop] === 'object' && typeof source[prop] === 'object' && !Array.isArray(_target[prop]) && !Array.isArray(source[prop]) ) {
			_target[prop] = extend(_target[prop], source[prop], override);
		} else {
			_target[prop] = source[prop];
		}
	}
	return _target;
}

function getCurrentLanguage () {
	return 'en';
}

fs.readFile(configPath, 'utf8', function ( error, data ) {
	var copy,
		idx = data.indexOf('var menu = {'),
		codeText = data.slice(idx);

		idx = codeText.indexOf('config = extend(config, models[gSTB.GetDeviceModelExt()]);');

		codeText = codeText.slice(0, idx);


	eval(codeText);


	for ( model in models ) {
		copy = JSON.parse(JSON.stringify(config));
		models[model] = extend(copy, models[model]);
		console.log(model + ' ' + models[model].logoImagePath);
	}

	fs.writeFileSync('models.json', JSON.stringify(models, null, 4));
	console.log('Write to models.json');



});
