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

		socket.on('machine', function (data){
			if(data.status=='finish'){
				db.run('UPDATE prints set status="done" WHERE status="printing"',function(err){
					if(err){
						cli.err(err);
					}
					io.emit('server', { server: 'reload' });
					cli.info('DONE PRINTING');
				});
			}
		});

	});


	function camera_open(socket){
		socket.emit('server', {camera: 'READY'});	
	}


};