module.exports = function(app,io,cli,db){

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
					res.render('index', { title: 'Drawbot', pt: rows });
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
					res.render('add', { title: '新增列印 | Drawbot', pt: rows});
				}
			});
		});

		
	});

	app.get('/list', function(req, res, next) {
		pt=getPrinting();

		db.serialize(function() {
			db.all('SELECT * FROM prints WHERE id', function(err, rows){
				if(err){
					cli.err(err);
				}else{

					db.all('SELECT * FROM prints WHERE status="printing"', function(err, rows1){
						if(err){
							cli.err(err);
						}else{
							res.render('list', { title: '列印列表 | Drawbot', items: rows, pt: rows1});
						}
					});
				}
			});
		});
	});

	app.get('/test', function(req, res, next){
		db.serialize(function(){
			// var insert = db.prepare("INSERT INTO prints (print_id, status) VALUES (?,?)");

			// for (var i = 0; i < 1000; i++){
			// 	insert.run(i,'standby');	
			// }

			// insert.finalize();

			db.run("DELETE FROM prints WHERE ID>0",function(err){
				if(err)
					cli.err(err);
			});

			// db.get("SELECT COUNT(*) FROM prints",function(err, rows){
			// 	cli.info(JSON.stringify(rows['COUNT(*)'], null, 2));	
			// });
			
		});
		res.send('OK');
	});

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

	// 讀取目前有哪些列印中
	function getPrinting(){

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