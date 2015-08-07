var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cookieSession = require('cookie-session');
var swig = require('swig');

// Set app & server
var app = express();                                                                           
var debug = require('debug')('drawbot-frontend:server');
var http = require('http');
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);
var server = http.createServer(app);
var io = require('socket.io')(server);
var cli = require('./script/colors');

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
      db.run("CREATE TABLE 'prints' \n" +
              "(id INTEGER PRIMARY KEY AUTOINCREMENT, \n" +
              "create_time DATETIME DEFAULT (datetime('now','localtime')), \n" +
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
      cli.log("SQL Table "+JSON.stringify(rows.name, null, 2)+" already initialized.");
    }
});

// BodyParser limit setting
app.use(cookieSession({ name: 'session', keys: ['AAA', 'BBB'] }));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true }));

// middleware
app.use(function (req, res, next) {
  if( req.session.logined == null ){
    req.session.logined = false;
  }
  next();
});


                                                                                       
                                                                                       
//   .g8"""bgd `7MM"""Mq.  `7MM"""Yp, `7MMF' `7MMF'     A     `7MF'`7MM"""YMM  `7MM"""Yp, 
// .dP'     `M   MM   `MM.   MM    Yb   MM     `MA     ,MA     ,V    MM    `7    MM    Yb 
// dM'       `   MM   ,M9    MM    dP   MM      VM:   ,VVM:   ,V     MM   d      MM    dP 
// MM            MMmmdM9     MM"""bg.   MM       MM.  M' MM.  M'     MMmmMM      MM"""bg. 
// MM.    `7MMF' MM  YM.     MM    `Y   MM      ,`MM A'  `MM A'      MM   Y  ,   MM    `Y 
// `Mb.     MM   MM   `Mb.   MM    ,9   MM     ,M :MM;    :MM;       MM     ,M   MM    ,9 
//   `"bmmmdPY .JMML. .JMM..JMMmmmd9  .JMMmmmmMMM  VF      VF      .JMMmmmmMMM .JMMmmmd9  

var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor
var sp = [];
var allPorts = [];


serialport.list(function (err, ports) {
  return 0;

  // if on rPi - http://www.hobbytronics.co.uk/raspberry-pi-serial-port
  if (fs.existsSync('/dev/ttyAMA0') && config.usettyAMA0 == 1) {
    ports.push({comName:'/dev/ttyAMA0',manufacturer: undefined,pnpId: 'raspberryPi__GPIO'});
    console.log('adding /dev/ttyAMA0 because it is enabled in config.js, you may need to enable it in the os - http://www.hobbytronics.co.uk/raspberry-pi-serial-port');
  }

  allPorts = ports;
  cli.log(allPorts);
  for (var i=0; i<ports.length; i++) {
  !function outer(i){

    sp[i] = {};
    sp[i].port = ports[i].comName;
    sp[i].q = [];
    sp[i].qCurrentMax = 0;
    sp[i].lastSerialWrite = [];
    sp[i].lastSerialReadLine = '';
    // 1 means clear to send, 0 means waiting for response
    sp[i].handle = new SerialPort(ports[i].comName, {
      parser: serialport.parsers.readline("\n"),
      baudrate: config.serialBaudRate
    });
    sp[i].sockets = [];

    sp[i].handle.on("open", function() {

      console.log('connected to '+sp[i].port+' at '+config.serialBaudRate);

      // line from serial port
      sp[i].handle.on("data", function (data) {
        serialData(data, i);
      });

      // loop for status ?
      setInterval(function() {
        // console.log('writing ? to serial');
        sp[i].handle.write('?');
      }, 1000);

    });

  }(i)
  }

});

//    ___  ____  __  ________________
//   / _ \/ __ \/ / / /_  __/ __/ __/
//  / , _/ /_/ / /_/ / / / / _/_\ \  
// /_/|_|\____/\____/ /_/ /___/___/  

var routes = require('./routes/index')(app,io,cli,db);
var io_listen = require('./routes/io_listen')(io,cli,db);
var grblweb = require('./routes/grblweb')(io,cli,db,sp,allPorts);

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
