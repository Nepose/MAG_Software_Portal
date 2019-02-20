/**
 * Module to prepare minimized and compressed version of page dependence files
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

//'use strict';

var program  = require('commander'),
	cheerio  = require('cheerio'),
	wrench   = require('wrench'),
	uglify   = require('uglify-js'),
	path     = require('path'),
	cleanCss = new (require('clean-css'))({noAdvanced:true, noRebase:true}),
	fs       = require('fs'),
	exec     = require('child_process').execSync,
	gitHash  = fs.existsSync(path.join(__dirname, '..', '.git')) && exec('git rev-parse HEAD').toString().trim();

// console colors
var red   = '\u001b[31m',
	bold  = '\u001b[1m',
	cyan  = '\u001b[36m',
	green = '\u001b[32m',
	reset = '\u001b[0m';

// all used js files
var jsUsedList = {};

// CLI init
program.version('0.1')
	.option('-s, --src [PATH]', 'source directory with files to proceed [..]', '..')
	.option('-d, --dst [PATH]', 'destination directory for the result build [../mini]', '..' + path.sep + 'mini')
	.parse(process.argv);

// the po file is given
if ( !program.src || typeof program.src !== 'string' ||
	 !program.dst || typeof program.dst !== 'string' ) { console.log('Not enough parameters!'); return; }

// normalize
program.src = path.resolve(program.src);
program.dst = path.resolve(program.dst);
// report
console.log(cyan + 'src:\t' + reset + bold + program.src + reset);
console.log(cyan + 'dst:\t' + reset + bold + program.dst + reset + "\n");

// prepare
wrench.rmdirSyncRecursive(program.dst, true);
wrench.mkdirSyncRecursive(program.dst);
// report
console.log(green + 'ok\t' + reset + 'prepared the destination directory');

// dirs
wrench.copyDirSyncRecursive(program.src + path.sep + 'public', program.dst + path.sep + 'public');
wrench.copyDirSyncRecursive(program.src + path.sep + 'system', program.dst + path.sep + 'system');
// files
fs.writeFileSync(program.dst + path.sep + 'index.html',    fs.readFileSync(program.src + path.sep + 'index.html',    {encoding:'utf8'}), {encoding:'utf8'});
fs.writeFileSync(program.dst + path.sep + 'services.html', fs.readFileSync(program.src + path.sep + 'services.html', {encoding:'utf8'}), {encoding:'utf8'});
fs.writeFileSync(program.dst + path.sep + 'rules.js',      fs.readFileSync(program.src + path.sep + 'rules.js',      {encoding:'utf8'}), {encoding:'utf8'});
// report
console.log(green + 'ok\t' + reset + 'cloned the source directory to the destination');/**/
console.log(green + 'ok\t' + reset + 'cleaning gettext localization files');

// remove all po files
walk(program.dst, '.po').forEach(function(item){
	fs.unlinkSync(item);
});

// recursively read directories contents
// and get all html files
walk(program.dst, '.html').forEach(function(item){
	var htmlFile = fs.readFileSync(item, {encoding:'utf8'});
	var jsName   = path.dirname(item) + path.sep + path.basename(item, '.html') + '.min.js';
	var jsData   = [];
	var scripts = [];
	// screen resolution correction
	htmlFile = htmlFile.replace(/WINDOW_HEIGHT/g, 'screen.height');
	htmlFile = htmlFile.replace(/WINDOW_WIDTH/g, 'screen.width');
	// parse
	var $ = cheerio.load(htmlFile, {ignoreWhitespace:false, xmlMode:false});
	// find and remove scripts
	$('script').each(function(){
		// only in case of include
		if ( $(this).attr('src') !== undefined && $(this).attr('src') !== 'rules.js' ) {
			var src = path.normalize(path.dirname(item) + path.sep + $(this).attr('src'));
			jsUsedList[src] = true;
			scripts.push(src);
			$(this).remove();
		}
	});
	// report
	console.log(green + 'ok\t' + reset + 'processed: ' + bold + path.relative(program.dst, item) + reset);
	// add one general
	if ( scripts.length > 0 ) {
		scripts.forEach(function(script){
			console.log('\t\tscript: ' + path.relative(program.dst, script));
			jsData.push(fs.readFileSync(script, {encoding:'utf8'}).trim());
		});
		$('head').append('\n\t<script type="text/javascript" src="' + path.basename(item, '.html') + '.min.js' + '"></script>\n');
		fs.writeFileSync(jsName, uglify.minify(jsData.join('\n\n\n'), {fromString:true, mangle:false}).code, {encoding:'utf8'});
	}
	htmlFile = $.html();
	// resave
	fs.writeFileSync(item, htmlFile, {encoding:'utf8'});
});

// clear all used js files
for ( var name in jsUsedList ) if ( jsUsedList.hasOwnProperty(name) ) fs.unlinkSync(name);
// gstb
fs.unlinkSync(program.dst + path.sep + 'system' + path.sep + 'gstb.js');
console.log(green + 'ok\t' + reset + 'cleared all used js files');

console.log(green + 'ok\t' + reset + 'prepare to compile language files');
// recursively read directories contents
// and get all js files to minimize
walk(program.dst, '.js').forEach(function(item){
	if ( item.indexOf('.min.js') === -1 && item.indexOf('rules.js') === -1 ) {
		fs.writeFileSync(
			item,
			uglify.minify(fs.readFileSync(item, {encoding:'utf8'}), {fromString:true, mangle:false}).code,
			{encoding:'utf8'}
		);
	}
});


console.log(green + 'ok\t' + reset + 'prepare to minify css files');
// minify css files
walk(program.dst, '.css').forEach(function(item){
	fs.writeFileSync(
		item,
		cleanCss.minify(fs.readFileSync(item, {encoding:'utf8'})),
		{encoding:'utf8'}
	);
});


// save build info
fs.writeFileSync(program.dst + path.sep + 'info.json', JSON.stringify({
	time: (new Date()).toUTCString(),
	hash: gitHash
}, null, '\t'), {encoding:'utf8'});


function walk ( dir, ext ) {
	var results = [];
	var list = fs.readdirSync(dir);
	list.forEach(function ( file ) {
		file = dir + path.sep + file;
		var stat = fs.statSync(file);
		if ( stat && stat.isDirectory() ) results = results.concat(walk(file, ext));
		else if ( path.extname(file) === ext ) results.push(file);
	});
	return results;
}
