module.exports = function(io) {

	// io.on('connection', function (socket) {
	//   socket.emit('news', { hello: 'world' });
	//   socket.on('my other event', function (data) {
	//     console.log(data);
	//   });
	// });

	io.on('connection', function (socket) {

		socket.on('new-print', function (data) {
			if(data.camera=='open'){
				console.log('{ request: "Camera open request." }');
				setTimeout(function(){camera_open(socket);}, 5000);
			}
		});

	});


	function camera_open(socket){
		socket.emit('server', {camera: 'ok'});	
	}


};