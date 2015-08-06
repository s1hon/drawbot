module.exports = function(app, io, cli, db){

	var fs = require('fs');
	var mkdirp = require("mkdirp");

	// `7MM"""Mq.   .g8""8q. `7MMF'   `7MF'MMP""MM""YMM `7MM"""YMM  
	//   MM   `MM..dP'    `YM. MM       M  P'   MM   `7   MM    `7  
	//   MM   ,M9 dM'      `MM MM       M       MM        MM   d    
	//   MMmmdM9  MM        MM MM       M       MM        MMmmMM    
	//   MM  YM.  MM.      ,MP MM       M       MM        MM   Y  , 
	//   MM   `Mb.`Mb.    ,dP' YM.     ,M       MM        MM     ,M 
	// .JMML. .JMM. `"bmmd"'    `bmmmmd"'     .JMML.    .JMMmmmmMMM 

	/* GET home page. */
	app.get('/', function(req, res, next) {

		db.serialize(function() {
			db.all('SELECT * FROM prints WHERE status="printing"', function(err, rows){
				if(err){
					cli.err(err);
				}else{
					res.render('index', { title: 'Drawbot', print_now: rows });
				}
			});
		});

	});

	/* GET home page. */
	app.get('/add', function(req, res, next) {

		db.serialize(function() {
			db.all('SELECT * FROM prints WHERE status="printing"', function(err, rows){
				if(err){
					cli.err(err);
				}else{
					res.render('add', { title: '新增列印 | Drawbot', print_now: rows});
				}
			});
		});

		
	});

	app.get('/list', function(req, res, next) {

		db.serialize(function() {
			db.all('SELECT * FROM prints WHERE id', function(err, rows){
				if(err){
					cli.err(err);
				}else{

					db.all('SELECT * FROM prints WHERE status="printing"', function(err, print_now){
						if(err){
							cli.err(err);
						}else{
							res.render('list', { title: '列印列表 | Drawbot', items: rows, print_now: print_now});
						}
					});
				}
			});
		});

	});

	// ID Controller
	app.post('/id/:id', function(req, res, next){

		if(req.session.logined == true) {
			var pid = req.params.id;
			var mode = req.body.mode;

			// `7MM"""Yb. `7MM"""YMM  `7MMF'      `7MM"""YMM MMP""MM""YMM `7MM"""YMM 
			//   MM    `Yb. MM    `7    MM          MM    `7 P'   MM   `7   MM    `7 
			//   MM     `Mb MM   d      MM          MM   d        MM        MM   d   
			//   MM      MM MMmmMM      MM          MMmmMM        MM        MMmmMM   
			//   MM     ,MP MM   Y  ,   MM      ,   MM   Y  ,     MM        MM   Y  ,
			//   MM    ,dP' MM     ,M   MM     ,M   MM     ,M     MM        MM     ,M
			// .JMMmmmdP' .JMMmmmmMMM .JMMmmmmMMM .JMMmmmmMMM   .JMML.    .JMMmmmmMMM
			if(mode == 'delete'){
				db.all('SELECT * FROM prints WHERE id="'+pid+'"', function(err, print_now){
					if(print_now.length != 0) {
						db.run('DELETE FROM prints WHERE id="'+pid+'"',function(err){
							if(err){
								cli.err(err);
							}
							fs.unlink('user-pic/'+pid+'.png', function (err) {
								if (err) throw err;
								console.log('successfully deleted '+pid+'.png');
								io.emit('server', { server: 'reload' });
								res.sendStatus(200);
							});
						});
					}
				});

			// `7MM"""Mq.`7MM"""Mq.  `7MMF'`7MN.   `7MF'MMP""MM""YMM `7MMF'`7MN.   `7MF' .g8"""bgd  
			//   MM   `MM. MM   `MM.   MM    MMN.    M  P'   MM   `7   MM    MMN.    M .dP'     `M  
			//   MM   ,M9  MM   ,M9    MM    M YMb   M       MM        MM    M YMb   M dM'       `  
			//   MMmmdM9   MMmmdM9     MM    M  `MN. M       MM        MM    M  `MN. M MM           
			//   MM        MM  YM.     MM    M   `MM.M       MM        MM    M   `MM.M MM.    `7MMF'
			//   MM        MM   `Mb.   MM    M     YMM       MM        MM    M     YMM `Mb.     MM  
			// .JMML.    .JMML. .JMM..JMML..JML.    YM     .JMML.    .JMML..JML.    YM   `"bmmmdPY  
			}else if(mode == 'printing'){
				db.all('SELECT * FROM prints WHERE status="printing"', function(err, print_now){
					if(print_now.length != 0) {
						if(print_now[0]['id'] != pid) {
							res.status(403).send('無法同時列印兩份文件！');
						}else{
							// Stop Printing
							db.run('UPDATE prints set status="standby" WHERE id="'+pid+'"',function(err){
								if(err){
									cli.err(err);
								}
								cli.info('STOP PRINTING: '+pid);
								io.emit('server', { server: 'reload' });
								res.sendStatus(200);
							});
						}
					}else{
						db.run('UPDATE prints set status="printing" WHERE id="'+pid+'"',function(err){
							if(err){
								cli.err(err);
								res.status(403).send('STOP FAIL');	
							}
							cli.info('START PRINTING: '+pid);
							io.emit('server', { server: 'reload' });
							res.sendStatus(200);
						});
					}
				});
			}
		}else{
			res.sendStatus(403);
		}

	});

	// 管理介面
	app.get('/admin', function(req, res, next){

		if(req.session.logined == false) {
			res.redirect('/login');
		}else{
			db.serialize(function() {
				db.all('SELECT * FROM prints WHERE id', function(err, rows){
					if(err){
						cli.err(err);
					}else{

						db.all('SELECT * FROM prints WHERE status="printing"', function(err, print_now){
							if(err){
								cli.err(err);
							}else{
								res.render('admin', { title: '列印列表 | Drawbot', items: rows, print_now: print_now});
							}
						});
					}
				});
			});
		}

	});

	app.get('/login', function(req, res, next){
		db.serialize(function() {
			db.all('SELECT * FROM prints WHERE status="printing"', function(err, rows){
				if(err){
					cli.err(err);
				}else{
					res.render('login', { title: '登入 | Drawbot', print_now: rows});
				}
			});
		});
	});

	app.post('/login', function(req, res, next){


		var passwd = req.body.password;

		if (passwd == "123456" ){
			req.session.logined = true;
			res.redirect("/admin");
		}else{
			req.session.logined = false;
			res.redirect("/login");
		}

	});

	app.get('/logout', function(req, res, next){
		req.session.logined = false;
		res.redirect("/admin");
	});
	
	// 測試用
	// app.get('/test', function(req, res, next){
	// 	db.serialize(function(){
	// 		// var insert = db.prepare("INSERT INTO prints (print_id, status) VALUES (?,?)");

	// 		// for (var i = 0; i < 1000; i++){
	// 		// 	insert.run(i,'standby');	
	// 		// }

	// 		// insert.finalize();

	// 		db.run("DELETE FROM prints WHERE ID>0",function(err){
	// 			if(err)
	// 				cli.err(err);
	// 		});

	// 		// db.get("SELECT COUNT(*) FROM prints",function(err, rows){
	// 		// 	cli.info(JSON.stringify(rows['COUNT(*)'], null, 2));	
	// 		// });
			
	// 	});
	// 	res.send('OK');
	// });

	// 接收canvas的資料，準備將資料轉成圖片再儲存
	app.post('/upload', function (req, res) {
		var upload = parseDataURL(req.body.data);

		if (upload){
			io.emit('server', { server: '傳送成功' });
			// cli.info('Get a picture');
			savePicture(upload.data);
		}else{
			io.emit('server', {ERR: '[ERR] Fail to get picture!'});
			cli.err('Server can not get the picutre');
		}

	});

	// `7MM"""YMM `7MMF'   `7MF'`7MN.   `7MF' .g8"""bgd MMP""MM""YMM `7MMF' .g8""8q. `7MN.   `7MF'
	//   MM    `7   MM       M    MMN.    M .dP'     `M P'   MM   `7   MM .dP'    `YM. MMN.    M  
	//   MM   d     MM       M    M YMb   M dM'       `      MM        MM dM'      `MM M YMb   M  
	//   MM""MM     MM       M    M  `MN. M MM               MM        MM MM        MM M  `MN. M  
	//   MM   Y     MM       M    M   `MM.M MM.              MM        MM MM.      ,MP M   `MM.M  
	//   MM         YM.     ,M    M     YMM `Mb.     ,'      MM        MM `Mb.    ,dP' M     YMM  
	// .JMML.        `bmmmmd"'  .JML.    YM   `"bmmmd'     .JMML.    .JMML. `"bmmd"' .JML.    YM  

	function printJSON(data){
		cli.log(JSON.stringify(data, null, 2));
	}

	// 將canvas的資訊轉換成Buffer
	function parseDataURL(body) {
		var match = /data:([^;]+);base64,(.*)/.exec(body);
		if(!match)
			return null;

		return {
			contentType: match[1],
			data: new Buffer(match[2], 'base64')
		};
	}

	// 將轉好的圖片存至硬碟中
	function savePicture(data,id) {
		// console.log(data);
		mkdirp('user-pic', function (err) {
			if (err) {
				return cli.err(err);
			} else {
				//Add a new record
				var insert = db.prepare("INSERT INTO prints (status) VALUES (?)");
				insert.run('standby');
				insert.finalize();

				//Get db counts
				db.get("SELECT id FROM prints order by id desc",function(err, rows){
					if(err){
						cli.err(err);
					}else{
						count =	JSON.stringify(rows['id'], null, 2);
						count = Number(count);

						// save file with count
						fs.writeFile('user-pic/'+count+'.png', data, function(err) {
							if(err){
								cli.err(err);
							}else{
								cli.info('Save a new record : '+count);
							}
						});
					}	
				});


			}
		});
	}

};