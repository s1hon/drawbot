module.exports = function(app,io){

	var base64 = require('node-base64-image');

	/* GET home page. */
	app.get('/', function(req, res, next) {
		res.render('index', { title: 'Drawbot' });
	});

	/* GET home page. */
	app.get('/new-print', function(req, res, next) {
		res.render('new-print', { title: '新增列印 | Drawbot' });
	});

	app.post('/upload', function (req, res) {
		var upload = parseDataURL(req.body.data);
		console.log(upload);
		io.emit('server', {server: '[SERVER] Get Picture!'});
	});

	function parseDataURL(body) {
		var match = /data:([^;]+);base64,(.*)/.exec(body);
		if(!match)
			return null;

		return {
			contentType: match[1],
			data: new Buffer(match[2], 'base64')
		};
	}

};