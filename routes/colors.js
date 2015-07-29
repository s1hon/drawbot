var clc = require('cli-color');

exports.err = function(msg){
	console.log(clc.red.bold('[ERR]',msg));
};

exports.warn = function(msg){
	console.log(clc.yellow.bold('[WARN]',msg));
};

exports.info = function(msg){
	console.log(clc.blueBright('[INFO]',msg));
};