module.exports = function(io,cli,db) {

	var config = require('./config');
	var serialport = require("serialport");
	var SerialPort = serialport.SerialPort; // localize object constructor
	var fs = require('fs');
	var EventEmitter = require('events').EventEmitter;
	var qs = require('querystring');

	function ConvChar( str ) {
	  c = {'<':'&lt;', 
	  		'>':'&gt;', 
	  		'&':'&amp;', 
	  		'"':'&quot;', 
	  		"'":'&#039;',
	       '#':'&#035;' };
	  return str.replace( /[<&>'"#]/g, function(s) { return c[s]; } );
	}

	var sp = [];
	var allPorts = [];

	serialport.list(function (err, ports) {

		// if on rPi - http://www.hobbytronics.co.uk/raspberry-pi-serial-port
		if (fs.existsSync('/dev/ttyAMA0') && config.usettyAMA0 == 1) {
			ports.push({comName:'/dev/ttyAMA0',manufacturer: undefined,pnpId: 'raspberryPi__GPIO'});
			cli.log('adding /dev/ttyAMA0 because it is enabled in config.js, you may need to enable it in the os - http://www.hobbytronics.co.uk/raspberry-pi-serial-port');
		}

		allPorts = ports;

		for (var i=0; i<ports.length; i++) {
		!function outer(i){

			sp[i] = {};
			sp[i].port = ports[i].comName;
			sp[i].q = [];
			sp[i].qCurrentMax = 0;
			sp[i].lastSerialWrite = [];
			sp[i].lastSerialReadLine = '';
			// 1 means clear to send, 0 means waiting for response
			sp[i].handle = new SerialPort(ports[i].comName, {
				parser: serialport.parsers.readline("\n"),
				baudrate: config.serialBaudRate
			});
			sp[i].sockets = [];

			sp[i].handle.on("open", function() {

				cli.info('connected to '+sp[i].port+' at '+config.serialBaudRate);

				// line from serial port
				sp[i].handle.on("data", function (data) {
					serialData(data, i);
				});

				// loop for status ?
				setInterval(function() {
					// cli.log('writing ? to serial');
					sp[i].handle.write('?');
				}, 1000);

			});

		}(i)
		}

	});

	function emitToPortSockets(port, evt, obj) {
		for (var i=0; i<sp[port].sockets.length; i++) {
			sp[port].sockets[i].emit(evt, obj);
		}
	}

	function serialData(data, port) {

		// handle ?
		if (data.indexOf('<') == 0) {
			// https://github.com/grbl/grbl/wiki/Configuring-Grbl-v0.8#---current-status

			// remove first <
			var t = data.substr(1);

			// remove last >
			t = t.substr(0,t.length-2);

			// split on , and :
			t = t.split(/,|:/);

			emitToPortSockets(port, 'machineStatus', {'status':t[0], 'mpos':[t[2], t[3], t[4]], 'wpos':[t[6], t[7], t[8]]});

			return;
		}

		if (queuePause == 1) {
			// pause queue
			return;
		}

		data = ConvChar(data);

		if (data.indexOf('ok') == 0) {

			// ok is green
			emitToPortSockets(port, 'serialRead', {'line':'<span style="color: green;">RESP: '+data+'</span>'});

			// run another line from the q
			if (sp[port].q.length > 0) {
				// there are remaining lines in the q
				// write one
				sendFirstQ(port);
			}

			// remove first
			sp[port].lastSerialWrite.shift();

		} else if (data.indexOf('error') == 0) {

			// error is red
			emitToPortSockets(port, 'serialRead', {'line':'<span style="color: red;">RESP: '+data+'</span>'});

			// run another line from the q
			if (sp[port].q.length > 0) {
				// there are remaining lines in the q
				// write one
				sendFirstQ(port);
			}

			// remove first
			sp[port].lastSerialWrite.shift();

		} else {
			// other is grey
			emitToPortSockets(port, 'serialRead', {'line':'<span style="color: #888;">RESP: '+data+'</span>'});
		}

		if (sp[port].q.length == 0) {
			// reset max once queue is done
			sp[port].qCurrentMax = 0;
		}

		// update q status
		emitToPortSockets(port, 'qStatus', {'currentLength':sp[port].q.length, 'currentMax':sp[port].qCurrentMax});

		sp[port].lastSerialReadLine = data;

	}

	var currentSocketPort = {};

	function sendFirstQ(port) {

		if (sp[port].q.length < 1) {
			// nothing to send
			return;
		}
		var t = sp[port].q.shift();

		// remove any comments after the command
		tt = t.split(';');
		t = tt[0];
		// trim it because we create the \n
		t = t.trim();
		if (t == '' || t.indexOf(';') == 0) {
			// this is a comment or blank line, go to next
			sendFirstQ(port);
			return;
		}
		//cli.log('sending '+t+' ### '+sp[port].q.length+' current q length');

		// loop through all registered port clients
		for (var i=0; i<sp[port].sockets.length; i++) {
			sp[port].sockets[i].emit('serialRead', {'line':'<span style="color: black;">SEND: '+t+'</span>'+"\n"});
		}
		sp[port].handle.write(t+"\n");
		sp[port].lastSerialWrite.push(t);
	}

	var queuePause = 0;
	io.sockets.on('connection', function (socket) {

		socket.emit('ports', allPorts);
		socket.emit('config', config);

		// do soft reset, this has it's own clear and direct function call
		socket.on('doReset', function (data) {
			// soft reset for grbl, send ctrl-x ascii \030
			sp[currentSocketPort[socket.id]].handle.write("\030");
			// reset vars
			sp[currentSocketPort[socket.id]].q = [];
			sp[currentSocketPort[socket.id]].qCurrentMax = 0;
			sp[currentSocketPort[socket.id]].lastSerialWrite = [];
			sp[currentSocketPort[socket.id]].lastSerialRealLine = '';
		});

		// lines from web ui
		socket.on('gcodeLine', function (data) {

			if (typeof currentSocketPort[socket.id] != 'undefined') {

				// valid serial port selected, safe to send
				// split newlines
				var nl = data.line.split("\n");
				// add to queue
				sp[currentSocketPort[socket.id]].q = sp[currentSocketPort[socket.id]].q.concat(nl);
				// add to qCurrentMax
				sp[currentSocketPort[socket.id]].qCurrentMax += nl.length;
				if (sp[currentSocketPort[socket.id]].q.length == nl.length) {
					// there was no previous q so write a line
					sendFirstQ(currentSocketPort[socket.id]);
				}

			} else {
				socket.emit('serverError', 'you must select a serial port');
			}

		});

		socket.on('clearQ', function(data) {
			// clear the command queue
			sp[currentSocketPort[socket.id]].q = [];
			// update the status
			emitToPortSockets(currentSocketPort[socket.id], 'qStatus', {'currentLength':0, 'currentMax':0});
		});

		socket.on('pause', function(data) {
			// pause queue
			if (data == 1) {
				cli.log('pausing queue');
				queuePause = 1;
			} else {
				cli.log('unpausing queue');
				queuePause = 0;
				sendFirstQ(currentSocketPort[socket.id]);
			}
		});

		socket.on('disconnect', function() {

			if (typeof currentSocketPort[socket.id] != 'undefined') {
				for (var c=0; c<sp[currentSocketPort[socket.id]].sockets.length; c++) {
					if (sp[currentSocketPort[socket.id]].sockets[c].id == socket.id) {
						// remove old
						sp[currentSocketPort[socket.id]].sockets.splice(c,1);
					}
				}
			}

		});

		socket.on('usePort', function (data) {

			cli.info('user wants to use port '+data);
			cli.info('switching from '+currentSocketPort[socket.id]);

			if (typeof currentSocketPort[socket.id] != 'undefined') {
				for (var c=0; c<sp[currentSocketPort[socket.id]].sockets.length; c++) {
					if (sp[currentSocketPort[socket.id]].sockets[c].id == socket.id) {
						// remove old
						sp[currentSocketPort[socket.id]].sockets.splice(c,1);
					}
				}
			}

			if (typeof sp[data] != 'undefined') {
				currentSocketPort[socket.id] = data;
				sp[data].sockets.push(socket);
			} else {
				socket.emit('serverError', 'that serial port does not exist');
			}
			
		});

	});
};