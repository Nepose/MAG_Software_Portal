'use strict';

module('jsonDb');

test('constructor', function () {
	var db = new jsonDb();
	strictEqual(db.constructor.name, 'jsonDb', 'constructor name');
	strictEqual(typeof db.data, 'object', 'db data type');
});

test('table', function () {
	var db = new jsonDb();
	strictEqual(db.table(), false, 'table lookup by empty name');

	var test = db.table('test');
	strictEqual(test.constructor.name, 'jsonDbTable', 'constructor name');
	strictEqual(typeof test.data, 'object', 'table data type');
});