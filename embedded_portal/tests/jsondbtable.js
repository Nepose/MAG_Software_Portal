'use strict';

module('jsonDbTable');

test('constructor', function () {
	var test = new jsonDbTable();
	strictEqual(test.constructor.name, 'jsonDbTable', 'constructor name');
	strictEqual(typeof test.data, 'object', 'table data type');
});

test('init', function () {
	var db = new jsonDb();
	var test = db.table('test');
	strictEqual(test.init(), false, 'table init with no data');

	strictEqual(test.init('id'), true, 'table init with 3 columns');
	deepEqual(test.data, {rows: {}, idName: 'id', rowIdx: 0, fldIds: [], fldIdx: {}}, 'table internal data structure');

	strictEqual(test.init('_id', 'name', 'data'), true, 'table init with 3 columns');
	deepEqual(test.data, {rows: {}, idName: '_id', rowIdx: 0, fldIds: ['name', 'data'], fldIdx: {name: 0, data: 1}}, 'table internal data structure');
	strictEqual(test.add(1), true, 'add partial row');

	strictEqual(test.init('id', 'name'), true, 'table reinit with 2 columns');
	deepEqual(test.data, {rows: {}, idName: 'id', rowIdx: 0, fldIds: ['name'], fldIdx: {name: 0}}, 'table internal data structure');
});

test('genId', function () {
	var db = new jsonDb();
	var test = db.table('test');
	test.init('id', 'name', 'type');
	strictEqual(test.genId(), '1', 'counter increment');
	strictEqual(test.genId(), '2', 'counter increment');
	strictEqual(test.genId(), '3', 'counter increment');
	strictEqual(test.data.rowIdx, 3, 'counter increment');
});

test('add', function () {
	var db = new jsonDb();
	var test = db.table('test');
	strictEqual(test.init('id', 'name', 'type'), true, 'table init with 3 columns');

	strictEqual(test.add(), false, 'add empty row');
	strictEqual(test.add(null), false, 'add empty row');
	strictEqual(test.add(null, 5, 8), false, 'add empty row');
	strictEqual(test.add(undefined), false, 'add empty row');
	strictEqual(test.add(null, null, null), false, 'add empty row');

	strictEqual(test.add(1), true, 'add partial row');
	strictEqual(Object.keys(test.data.rows).length, 1, 'table rows count');
	deepEqual(test.data.rows[1], [null, null], 'row data check');

	strictEqual(test.add('2', 'name1', 'type1'), true, 'add full row');
	deepEqual(test.data.rows[2], ['name1', 'type1'], 'row data check');
	strictEqual(Object.keys(test.data.rows).length, 2, 'table rows count');

	strictEqual(test.add(3, {a: 1, b: 2}, [2, 4, 8]), true, 'add full complex row');
	deepEqual(test.data.rows[3], [
		{a: 1, b: 2},
		[2, 4, 8]
	], 'row data check');

	strictEqual(test.add(4, false, undefined), true, 'add partly empty row');
	deepEqual(test.data.rows[4], [false, null], 'row data check');

	strictEqual(test.add('5', 0, true), true, 'add partly empty row');
	deepEqual(test.data.rows[5], [0, true], 'row data check');

	strictEqual(test.add(6, {}, []), true, 'add partly empty row');
	deepEqual(test.data.rows[6], [
		{},
		[]
	], 'row data check');

	strictEqual(test.add(7, 1, 2, 3, 4, 5), true, 'add row with too many columns');
	deepEqual(test.data.rows[7], [1, 2], 'row data check');

	strictEqual(test.add('8', 'a'), true, 'add partial row');
	deepEqual(test.data.rows[8], ['a', null], 'row data check');

	strictEqual(test.add(8), false, 'add duplicate id row');
	strictEqual(test.add(8, 'a'), false, 'add duplicate id row');
	strictEqual(test.add(8, 'b', 'c'), false, 'add duplicate id row');
});

test('get', function () {
	var db = new jsonDb();
	var test = db.table('test');
	test.init('id', 'name', 'type');
	test.add(1);
	test.add(2, 'name1', 'type1');
	test.add(3, {a: 1, b: 2}, [2, 4, 8]);
	test.add(4, false, undefined);
	test.add(5, 0, true);
	test.add(6, {}, []);
	test.add(7, 1, 2, 3, 4, 5);
	test.add(8, 'a');
	strictEqual(Object.keys(test.data.rows).length, 8, 'table rows count');

	deepEqual(test.get(1), {id: '1', name: null, type: null}, 'row data check');
	deepEqual(test.get(2), {id: '2', name: 'name1', type: 'type1'}, 'row data check');
	deepEqual(test.get(3), {id: '3', name: {a: 1, b: 2}, type: [2, 4, 8]}, 'row data check');
	deepEqual(test.get(4), {id: '4', name: false, type: null}, 'row data check');
	deepEqual(test.get('7'), {id: '7', name: 1, type: 2}, 'row data check');
	deepEqual(test.get(123), false, 'row data check');
	deepEqual(test.get(null), false, 'row data check');
	deepEqual(test.get(undefined), false, 'row data check');
	deepEqual(test.get(5, 'name'), 0, 'row field data check');
	deepEqual(test.get(2, 'type'), 'type1', 'row field data check');
});

test('set', function () {
	var db = new jsonDb();
	var test = db.table('test');
	test.init('id', 'name', 'type');

	strictEqual(test.set(), false, 'empty wrong data');
	strictEqual(test.set(null), false, 'empty wrong data');
	strictEqual(test.set(''), false, 'empty wrong data');
	strictEqual(test.set(0), false, 'empty wrong data');
	strictEqual(test.set(null, null), false, 'empty wrong data');
	strictEqual(test.set(1, null), false, 'empty wrong data');
	strictEqual(test.set(1, 2), false, 'wrong data');
	strictEqual(test.set(1, ''), false, 'wrong data');
	strictEqual(test.set(1, 'sdfg'), false, 'wrong data');
	strictEqual(Object.keys(test.data.rows).length, 0, 'table rows count');

	strictEqual(test.set(1, []), true, 'empty data');
	deepEqual(test.data.rows[1], [null, null], 'row data check');
	strictEqual(test.set(1, {}), true, 'empty data');
	deepEqual(test.data.rows[1], [null, null], 'row data check');

	strictEqual(test.set(1, {name: 'qwe'}), true, 'update data');
	deepEqual(test.data.rows[1], ['qwe', null], 'row data check');

	strictEqual(test.set(1, {name: 'qwe2'}), true, 'update data');
	deepEqual(test.data.rows[1], ['qwe2', null], 'row data check');

	strictEqual(test.set(1, {type: 'rty'}), true, 'update data');
	deepEqual(test.data.rows[1], ['qwe2', 'rty'], 'row data check');

	strictEqual(test.set(1, {data: 'some'}), true, 'update non-existing field');
	deepEqual(test.data.rows[1], ['qwe2', 'rty'], 'row data check');

	strictEqual(test.set(1, {name: 'qwe3', data: 'some'}), true, 'update existing and non-existing fields');
	deepEqual(test.data.rows[1], ['qwe3', 'rty'], 'row data check');

	strictEqual(test.set(1, {name: 'qwe3', id: '123'}), true, 'update existing and non-existing fields');
	deepEqual(test.data.rows[1], ['qwe3', 'rty'], 'row data check');

	strictEqual(test.set(1, {type: [], name: {}}), true, 'update complex data');
	deepEqual(test.data.rows[1], [
		{},
		[]
	], 'row data check');
});

test('unset', function () {
	var db = new jsonDb();
	var test = db.table('test');
	test.init('id', 'name', 'type');

	strictEqual(test.set(1, []), true, 'empty data');
	strictEqual(Object.keys(test.data.rows).length, 1, 'table rows count');
	strictEqual(test.unset(1), true, 'clear');
	strictEqual(Object.keys(test.data.rows).length, 0, 'table rows count');
});

test('clear', function () {
	var db = new jsonDb();
	var test = db.table('test');
	test.init('id', 'name', 'type');
	test.add(1, 'a1', 'b1');
	test.add(2, 'a1', 'b2');
	test.add(3, 'a1', 'b3');
	test.add(4, 'a2', 'b1');
	test.add(5, 'a2', 'b2');
	test.add(6, 'a2', 'b3');
	deepEqual(test.find({}).length, 6, 'check length');
	test.clear();
	deepEqual(test.find({}).length, 0, 'check length');
	deepEqual(test.data.rowIdx, 0, 'index value');
});

test('find', function () {
	var db = new jsonDb();
	var test = db.table('test');
	test.init('id', 'name', 'type');
	test.add(1, 'a1', 'b1');
	test.add(2, 'a1', 'b2');
	test.add(3, 'a1', 'b3');
	test.add(4, 'a2', 'b1');
	test.add(5, 'a2', 'b2');
	test.add(6, 'a2', 'b3');

	deepEqual(test.find().length, 0, 'wrong filter');
	deepEqual(test.find(null).length, 0, 'wrong filter');
	deepEqual(test.find(false).length, 0, 'wrong filter');
	deepEqual(test.find('qwe').length, 0, 'wrong filter');
	deepEqual(test.find({name: 'a0'}).length, 0, 'wrong filter');

	deepEqual(test.find({}).length, 6, 'filter all');
	deepEqual(test.find({name: 'a1'}).length, 3, 'filter by name');
	deepEqual(test.find({type: 'b1'}).length, 2, 'filter by type');
	deepEqual(test.find({type: 'b1'}).pop(), {id: '4', name: 'a2', type: 'b1'}, 'filter by type last item');

	deepEqual(test.find({name: 'a1'}, 0).length, 3, 'filter by name');
	deepEqual(test.find({name: 'a1'}, 2).length, 2, 'filter by name');
});