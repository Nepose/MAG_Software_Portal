'use strict';

module('stbStorage API');

test('methods availability', function () {
	strictEqual(typeof stbStorage.length,     'number',   'stbStorage.count');
	strictEqual(typeof stbStorage.clear,      'function', 'stbStorage.clear');
	strictEqual(typeof stbStorage.key,        'function', 'stbStorage.keys');
	strictEqual(typeof stbStorage.getItem,    'function', 'stbStorage.getItem');
	strictEqual(typeof stbStorage.setItem,    'function', 'stbStorage.setItem');
	strictEqual(typeof stbStorage.removeItem, 'function', 'stbStorage.removeItem');
});

test('general', function () {
	stbStorage.clear();
	strictEqual(stbStorage.length, 0, 'count after clear');
	strictEqual(stbStorage.getItem('missingKey'), null, 'request missing key');
	strictEqual(stbStorage.removeItem('missingKey'), undefined, 'remove missing key');
	strictEqual(stbStorage.length, 0, 'count empty');

	stbStorage.setItem('key1', 'val1');
	strictEqual(stbStorage.length, 1, 'count');
	strictEqual(stbStorage.getItem('key1'), 'val1', 'request key value');
	stbStorage.setItem('key1', 'val2');
	strictEqual(stbStorage.getItem('key1'), 'val2', 'updated key value');
	strictEqual(stbStorage.removeItem('key1'), undefined, 'remove the key');
	strictEqual(stbStorage.removeItem('key1'), undefined, 'remove the key again');
	strictEqual(stbStorage.length, 0, 'count');
	stbStorage.setItem('key1', 128);
	strictEqual(stbStorage.getItem('key1'), '128', 'numeric key value');
	stbStorage.setItem('key2', true);
	strictEqual(stbStorage.getItem('key2'), 'true', 'boolean key value');
	stbStorage.clear();
	stbStorage.setItem('key2', true);
	strictEqual(stbStorage.key(0), 'key2', 'get key name by index');
	strictEqual(stbStorage.key(8), null, 'get key name by wrong index');
});
