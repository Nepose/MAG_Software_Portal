var DEFAULT_URL = "http://stbhelp.iptv.infomir.com.ua/HelpGenerator.php?relative_path=pages",
	file;

var program =   require('commander'),
	request = 	require('request'),
	fs = 		require('fs'),
	wrench = 	require('wrench'),
	admzip = 	require('adm-zip'),
	path =	 	require('path');

// console colors
var red   = '\u001b[31m',
	bold  = '\u001b[1m',
	cyan  = '\u001b[36m',
	green = '\u001b[32m',
	reset = '\u001b[0m';

// CLI init
program.version('0.1')
	.option('-d, --dst [PATH]', 'destination directory for the help [../public/app/help/pages]', '../public/app/help/pages')
	.option('-d, --src [PATH]', 'download url for the help archive [' + DEFAULT_URL + ']', DEFAULT_URL)
	.parse(process.argv);

// Normalize
program.dst = path.resolve(program.dst);

console.log(green + 'ok\t' + reset + 'prepared the destination directory');
// prepare
wrench.rmdirSyncRecursive(program.dst, true);
wrench.mkdirSyncRecursive(program.dst);

var zip_path = program.dst + path.sep + "help.zip",
	out = fs.createWriteStream(zip_path),
	zip;

request(program.src, {timeout: 5 * 60* 1000})
	.pipe(out)
	.on("close", function () {
		console.log(green + 'ok\t' + reset + "archive downloaded");
		console.log(green + 'ok\t' + reset + "start unpacking");
	    zip = new admzip(zip_path);
	    zip.extractAllTo(program.dst, true);
		console.log(green + 'ok\t' + reset + "archive unpacked");
		fs.unlink(zip_path, function (err) {
			if (err) throw err;
			console.log(green + 'ok\t' + reset + 'archive successfully removed');
		});
	});
