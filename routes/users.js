var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.send('respond with a resource : /users/index');
});


router.get('/:id', function(req, res, next) {
  res.send('respond with a resource : '+req.params.id);
});

module.exports = router;
