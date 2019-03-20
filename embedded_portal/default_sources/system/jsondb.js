/**
 * Json DataBase simple implementation
 * @author Stanislav Kalashnik <sk@infomir.eu>
 * @license GNU GENERAL PUBLIC LICENSE Version 3
 */

'use strict';

/**
 * Main DataBase object
 * @constructor
 * @param {Object} [data={}] initial data provided
 */
function jsonDb ( data ) {
	this.data = data || {};
}

/**
 * Table handler
 * gets the specified table by its name or creates one
 * @param {string} name new or existing db table name
 * @return {jsonDbTable|boolean} newly created table object or false on failure
 */
jsonDb.prototype.table = function ( name ) {
	if ( name ) {
		// data placeholder if not exist
		if ( typeof this.data[name] !== 'object' ) {
			this.data[name] = {};
		}
		// wrap data with object
		return new jsonDbTable(this.data[name]);
	}
	return false;
};


/**
 * DataBase table object
 * should be called directly only from the jsonDb object
 * @constructor
 * @param {Object} [data={}] initial data provided
 */
function jsonDbTable ( data ) {
	this.data = data || {};
}

/**
 * Initializes the table inner data structure and sets table field names
 * @param {string} id the first mandatory column
 * @param {...String} fields free list of fields
 * @return {boolean} operation success status
 * @example
 *		// two columns table creation
 *		table.init('id', 'name');
 */
jsonDbTable.prototype.init = function ( id, fields ) {
	if ( arguments.length > 0 ) {
		// reset all to default (without breaking the link to db)
		this.data.rows   = {};  // all table records in the compact form  {id:[fld1, fld2, fld3]}
		this.data.idName = Array.prototype.shift.call(arguments);
		this.data.rowIdx = 0;   // last used table index (is used by genId method to get unique id)
		this.data.fldIds = [];  // list ['name', 'title']
		this.data.fldIdx = {};  // hash {name:0, title:1}
		// apply all other fields names
		for ( var index = 0; index < arguments.length; index++ ) {
			// plain list of names
			this.data.fldIds[index] = arguments[index];
			// hash map name to index
			this.data.fldIdx[arguments[index]] = index;
		}
		return true;
	}
	return false;
};

/**
 * Unique identifier counter
 * produces an id on each call
 * @return {string} id for add method
 */
jsonDbTable.prototype.genId = function () {
	return (++this.data.rowIdx).toString();
};

/**
 * Creates a new data record with the given id
 * @param {string|number} id mandatory unique row identifier (converted to string)
 * @param {...*} data free list of column values
 * @return {boolean} operation success status
 * @example
 *		// new record with id 2
 *		table.add(2, 'some name');
 */
jsonDbTable.prototype.add = function ( id, data ) {
	var row = [], index;
	// init new record
	if ( id && this.data.rows[id] === undefined ) {
		// iterate all table fields
		for ( index = 0; index < this.data.fldIds.length; index++ ) {
			// and get corresponding items from incoming data
			row[index] = arguments[index+1] !== undefined ? arguments[index+1] : null;
		}
		// apply a filled new record
		this.data.rows[id] = row;
		return true;
	}
	return false;
};

/**
 * Retrieves a data record by the given id
 * @param {string|number} id mandatory unique row identifier
 * @param {string} [field] row column name to return
 * @return {*} row data item, its one field value or false on failure
 * @example
 *		// get record data with id 2
 *		table.get(2);
 *		// get a single record data field with id 2
 *		table.get(2, 'name');
 */
jsonDbTable.prototype.get = function ( id, field ) {
	var row = this.data.rows[id],
		index, data = {};
	// existing record
	if ( row !== undefined ) {
		// field name is given
		if ( field !== undefined ) {
			// and valid
			if ( field in this.data.fldIdx ) {
				// single field
				return row[this.data.fldIdx[field]];
			}
		} else {
			// explicit id return
			data[this.data.idName] = id.toString();
			// make a real object from a compact record
			for ( index = 0; index < row.length; index++ ) {
				data[this.data.fldIds[index]] = row[index];
			}
			// all fields
			return data;
		}
	}
	return false;
};

/**
 * Updates the record find by id with the given fields
 * in case there is no such record creates a new one
 * @param {string|number} id mandatory unique row identifier
 * @param {Object} data pairs of field names with values
 * @return {boolean} operation success status
 * @example
 *		// update record with id 2
 *		table.set(2, {name:'some other name'});
 */
jsonDbTable.prototype.set = function ( id, data ) {
	var row = [], index, name;
	// valid incoming data
	if ( id && data && typeof data === 'object' ) {
		// init a new record if necessary
		if ( this.data.rows[id] === undefined ) {
			// iterate all table fields and set to null
			for ( index = 0; index < this.data.fldIds.length; index++ ) {
				row[index] = null;
			}
			// apply a null-filled new record
			this.data.rows[id] = row;
		} else {
			// link to existing item
			row = this.data.rows[id];
		}
		// update the given fields
		for ( name in data ) {
			// fill some existing fields
			if ( name in this.data.fldIdx ) {
				row[this.data.fldIdx[name]] = data[name];
			}
		}
		return true;
	}
	return false;
};

/**
 * Clears a row by the given id
 * @param {string|number} id mandatory unique row identifier
 * @return {boolean} operation success status
 * @example
 *		// remove record with id 2
 *		table.unset(2);
 */
jsonDbTable.prototype.unset = function ( id ) {
	return delete this.data.rows[id];
};

/**
 * Removes all records and resets the index
 */
jsonDbTable.prototype.clear = function () {
	this.data.rows = {};
	this.data.rowIdx = 0;
};

/**
 * Collects all records matching the given filter
 * @param {Object} where filter conditions to check ({} - all records, omitted - no records)
 * @param {number} [limit=none] positive number of records to return (otherwise - no limitations)
 * @return {Array} all found rows
 * @example
 *		// get all records with the specific name
 *		table.find({name:'some name'});
 *		// get only 2 records with the specific name
 *		table.find({name:'some name'}, 2);
 */
jsonDbTable.prototype.find = function ( where, limit ) {
	var rows = this.data.rows, item,
		data = [], id, condition, match, index;
	// check incoming filter
	if ( where && typeof where === 'object' ) {
		// iterate all table rows
		for ( id in rows ) {
			// suitable by default
			match = true;
			// check all the filter attributes (all should match)
			for ( condition in where ) {
				match = match && (rows[id][this.data.fldIdx[condition]] === where[condition]);
			}
			// fill result list with matched records
			if ( match ) {
				// wrap
				item = {};
				// explicit id return
				item[this.data.idName] = id;
				// make a real object from a compact record
				for ( index = 0; index < rows[id].length; index++ ) {
					item[this.data.fldIds[index]] = rows[id][index];
				}
				data.push(item);
				// get enough check and exit
				if ( limit !== undefined && limit === data.length ) {
					return data;
				}
			}
		}
	}
	return data;
};
