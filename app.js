var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var swig = require('swig');

// Set app & server
var app = express();                                                                           
var debug = require('debug')('drawbot-frontend:server');
var http = require('http');
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);
var server = http.createServer(app);
var io = require('socket.io')(server);
var cli = require('./routes/colors');

// `7MM"""Yb.      db   MMP""MM""YMM   db      `7MM"""Yp,      db       .M"""bgd `7MM"""YMM  
//   MM    `Yb.   ;MM:  P'   MM   `7  ;MM:       MM    Yb     ;MM:     ,MI    "Y   MM    `7  
//   MM     `Mb  ,V^MM.      MM      ,V^MM.      MM    dP    ,V^MM.    `MMb.       MM   d    
//   MM      MM ,M  `MM      MM     ,M  `MM      MM"""bg.   ,M  `MM      `YMMNq.   MMmmMM    
//   MM     ,MP AbmmmqMA     MM     AbmmmqMA     MM    `Y   AbmmmqMA   .     `MM   MM   Y  , 
//   MM    ,dP'A'     VML    MM    A'     VML    MM    ,9  A'     VML  Mb     dM   MM     ,M 
// .JMMmmmdP'.AMA.   .AMMA..JMML..AMA.   .AMMA..JMMmmmd9 .AMA.   .AMMA.P"Ybmmd"  .JMMmmmmMMM 

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./print_list.db');

// Database initialization
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='prints'",
  function(err, rows) {
    if(err !== null) {
      cli.err(err);
    }
    else if(rows === undefined) {
      db.run("CREATE TABLE 'prints' " +
              "(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
              "create_time DATETIME DEFAULT (datetime('now','localtime')), " +
              "print_id CHAR(6) UNIQUE NOT NULL, " +
              "file STRING NOT NULL, " +
              "status STRING NOT NULL)", function(err) {
        if(err !== null) {
          cli.err(err);
        }
        else {
          cli.log("SQL Table 'prints' initialized.");
        }
      });
    }
    else {
      cli.log("SQL Table 'prints' already initialized.");
    }
});

// BodyParser limit setting
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true }));

//    ___  ____  __  ________________
//   / _ \/ __ \/ / / /_  __/ __/ __/
//  / , _/ /_/ / /_/ / / / / _/_\ \  
// /_/|_|\____/\____/ /_/ /___/___/  

var routes = require('./routes/index')(app,io,cli,db);
var io_listen = require('./routes/io_listen')(io,cli,db);

// view engine setup
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

//  _____          _       
// /  ___|        (_)      
// \ `--.__      ___  __ _ 
//  `--. \ \ /\ / / |/ _` |
// /\__/ /\ V  V /| | (_| |
// \____/  \_/\_/ |_|\__, |
//                    __/ |
//                   |___/  記得cache之後上線要打開

// Swig will cache templates for you, but you can disable
// that and use Express's caching instead, if you like:
app.set('view cache', false);
// To disable Swig's cache, do the following:
swig.setDefaults({ cache: false });
// NOTE: You should always cache templates in a production environment.
// Don't leave both of these to `false` in production!


// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
// app.use(logger('dev')); // Open request log or not
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/pic',express.static(path.join(__dirname, 'user-pic')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});


//
// ____    __    ____ ____    __    ____ ____    __    ____ 
// \   \  /  \  /   / \   \  /  \  /   / \   \  /  \  /   / 
//  \   \/    \/   /   \   \/    \/   /   \   \/    \/   /  
//   \            /     \            /     \            /   
//    \    /\    /       \    /\    /       \    /\    /    
//     \__/  \__/         \__/  \__/         \__/  \__/     
//
                                                                                          

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
