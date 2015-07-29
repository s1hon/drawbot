var clc = require('cli-color');

module.exports = {

	err: function (msg) {
		console.log(clc.red.bold(msg));
	},

	warn: function (msg) {
		console.log(clc.yellow.bold(msg));
	},

	info: function (msg) {
		console.log(clc.blueBright(msg));	
	}

};