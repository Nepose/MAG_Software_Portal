/**
 * compare environment variables with default values (file vars.ini)
 * @author Fedotov Dmytro
 * @date 25.04.14
 */

function checkEnvVars () {
	echo('checkEnvVars');
	var xhr, responseData;

	xhr = new XMLHttpRequest();
	xhr.open('post', PATH_SYSTEM + 'variables/vars.ini', false);
	xhr.send();
	echo(xhr.status, 'xhr.status');
	echo(xhr.responseText, 'xhr.responseText');
	responseData = parseFileData(xhr.responseText);
	responseData = compareData(responseData);
	setNewData(responseData);


	// compare file and environment
	function compareData ( fileData ) {
		var environment,
			difference = [],
			query = { varList: []};

		fileData.forEach(function ( key ) { query.varList.push(key.name); });
		try {
			environment = JSON.parse(gSTB.GetEnv(JSON.stringify(query))).result;
		} catch ( e ) {
			echo(e, 'env parse error');
			environment = [];
		}
		fileData.forEach(function ( key ) {
			if ( environment[key.name] === undefined || environment[key.name] !== key.value ) {
				difference.push({name: key.name, value: key.value});
			}
		});
		return difference;
	}

	// parse file
	function parseFileData ( response ) {
		var data = [],
			tmpArr, name, value, valPos, i;
		if ( response ) {
			tmpArr = response.split('\n');
			for ( i = 0; i < tmpArr.length; i++ ) {
				valPos = tmpArr[i].indexOf('=');
				if ( tmpArr[i].indexOf(';') !== -1 || valPos === -1 ) { continue; }
				name = tmpArr[i].substring(0, valPos);
				value = tmpArr[i].substring(valPos + 1);
				if ( name !== '' ) {
					data.push({name: name, value: value});
				}
			}
		}
		return data;
	}

	// set new environment variable values
	function setNewData ( dataForChange ) {
		var newData = {};
		if ( dataForChange.length ) {
			dataForChange.forEach(function ( key ) { newData[key.name] = key.value; });
			gSTB.SetEnv(JSON.stringify(newData));
		}
	}

	return true;
}
