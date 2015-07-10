module.exports = function(app,io){

	/* GET home page. */
	app.get('/', function(req, res, next) {
		res.render('index', { title: 'Drawbot' });
	});

	/* GET home page. */
	app.get('/new-print', function(req, res, next) {
		res.render('new-print', { title: '新增列印|Drawbot' });
	});

};