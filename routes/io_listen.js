module.exports = function(io,cli,db) {

	// io.on('connection', function (socket) {
	//   socket.emit('news', { hello: 'world' });
	//   socket.on('my other event', function (data) {
	//     console.log(data);
	//   });
	// });

	io.on('connection', function (socket) {

		socket.on('new-print', function (data) {
			if(data.camera=='open'){
				cli.log('{ request: "Camera open request." }');
				setTimeout(function(){camera_open(socket);}, 500);
			}

			if(data.ERR){
				cli.err(data.ERR);
			}

		});

		socket.on('list', function (data){
			if(data.id){
				// cli.info('{ req: get '+data.id+' info }');
				db.all('SELECT * FROM prints WHERE id="'+data.id+'"', function(err, rows){
					if(err){
						socket.emit('list', {err: "err"});
						cli.err(err);
					}else{
						socket.emit('list', rows[0]);
					}
				});
			}
		});

	});


	function camera_open(socket){
		socket.emit('server', {camera: 'READY'});	
	}


};