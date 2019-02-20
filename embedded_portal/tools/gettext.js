/**
 * Module to convert gettext po file to js representation
 * @author Stanislav Kalashnik <sk@infomir.eu>
 * @edited Igor Kopanev
 */

var program = require('commander'),
	pofile  = require('pofile'),
	path    = require('path'),
	fs      = require('fs');

// console colors
var red   = '\u001b[31m',
	bold  = '\u001b[1m',
	cyan  = '\u001b[36m',
	green = '\u001b[32m',
	reset = '\u001b[0m';

function list( str ){
	return str.split(' ');
}

// CLI init
program.version('0.1')
	.option('-f, --file [path]', 'gettext destination file')
	.option('-s, --sources <files>', 'gettext po files', list)
	.parse(process.argv);

// the po files is given
if ( !program.sources || !Array.isArray(program.sources) ) { console.log('Not enough parameters!'); return; }

var jsFile = program.file,
	count  = 0,
	items  = {},
	result = [
		'/**',
		' * automatically generated gettext localization dictionary',
		' * do not edit manually, correction will be lost'
	],
	itemsSorted = {},
	itemsSum = 0,
	fuzzyCount = 0,
	keyList, overwritten;


// proceed all given po files
program.sources.forEach(function ( poFile ) {
	// absolute path
	poFile = path.resolve(poFile.trim());
	// get localization
	var po = pofile.parse(fs.readFileSync(poFile, {encoding: 'utf8'}));
	// dump name
	console.log(cyan + 'file:\t' + reset + poFile + '\t' + green + po.items.length + reset);

	// apply for the first po file
	if ( count === 0 ) {
		jsFile = jsFile || (path.dirname(poFile) + path.sep + path.basename(poFile, '.po') + '.js');
		result.push(' * @name '     + po.headers['Project-Id-Version']);
		result.push(' * @language ' + po.headers['Language']);
		result.push(' */');
	}
	count++;

	// fill items
	po.items.forEach(function ( item ) {
		// skip commented
		if ( item.obsolete === true ) {
			return;
		}

		if ( item.flags.fuzzy ) {
			fuzzyCount++;
		}

		// find duplicates
		if ( items[item.msgid] && items[item.msgid] !== item.msgstr[0] ) {
			console.log(red + '\toverwritten: ' + reset + item.msgid + ' (old: "' + items[item.msgid] + '" new: "' + item.msgstr[0] + '")');
		}
		items[item.msgid] = item.msgstr[0];
	});
	itemsSum = itemsSum + po.items.length;
});

keyList = Object.keys(items);
overwritten = itemsSum - keyList.length;
// sorting by key names
keyList.sort().forEach(function ( key ) {
	if ( itemsSorted[key] ) {
		console.log('\toverwritten:' + key);
	}
	if ( items[key] && items[key].length > 0 ) {
		itemsSorted[key] = items[key];
	}
});
result.push('gettext.load(' + JSON.stringify(itemsSorted, null, 4) + ');');

// and save
console.log(cyan + 'build:\t' + reset + bold + jsFile + '\t' + green + keyList.length + reset + (fuzzyCount ? red : green) + '\tfuzzy:' + fuzzyCount + reset + (overwritten ? ' (total overwritten: ' + overwritten + ')' : '') + '\n');

// store js file
fs.writeFileSync(jsFile, result.join('\n'), {encoding:'utf8'});
