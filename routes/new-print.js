var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('new-print', { title: '新增列印|Drawbot' });
});

module.exports = router;