var clc = require('cli-color');
var dateFormat = require('dateformat');
var now = new Date();

function nt(){
	var t = clc.cyan(dateFormat(now, "[HH:MM:ss]"));
	return t;
}

exports.log = function(msg){
	console.log(nt(),clc.xterm(253)('[LOG]',msg));
};

exports.err = function(msg){
	console.log(nt(),clc.red.bold('[ERR]',msg));
};

exports.warn = function(msg){
	console.log(nt(),clc.yellow.bold('[WARN]',msg));
};

exports.info = function(msg){
	console.log(nt(),clc.blueBright('[INFO]',msg));
};

