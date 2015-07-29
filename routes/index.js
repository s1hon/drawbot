module.exports = function(app,io){

	var fs = require('fs');
	var cli = require('./colors.js');

	/* GET home page. */
	app.get('/', function(req, res, next) {
		res.render('index', { title: 'Drawbot' });
	});

	/* GET home page. */
	app.get('/new-print', function(req, res, next) {
		res.render('new-print', { title: '新增列印 | Drawbot' });
	});

	// 接收canvas的資料，準備將資料轉成圖片再儲存
	app.post('/upload', function (req, res) {
		var upload = parseDataURL(req.body.data);

		if (upload){
			io.emit('server', {server: '傳送成功！'});
			console.log('[SERVER] Get a picture!');
			savePicture(upload.data);
		}else{
			io.emit('server', {ERR: '[ERR] Fail to get picture!'});
			console.log('[ERR] Server can not get picutre');
		}

	});

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
	function savePicture(data) {
		console.log(data);
		fs.writeFile('user-pic/test.png', data, function(err) {
			if(err){
				console.log(err);
			}else{
				console.log('[SERVER] Save picutre already!');
				// console.time('100-elements');
				// for (var i = 0; i < 1000; i++) {
				//   console.log(i);
				// }
				// console.timeEnd('100-elements');
			}
		});

	}

};