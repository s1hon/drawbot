var gulp = require('gulp');
var server = require('gulp-express');
var sass = require('gulp-ruby-sass');
var minifyCSS = require('gulp-minify-css');

gulp.task('server', function() {
	// Start the server at the beginning of the task 
	server.run(['bin/www']);

    // Restart the server when file changes 
    gulp.watch(['views/*.html'], server.notify);
    gulp.watch(['public/css/*.css'], server.notify);
    
    gulp.watch(['public/scss/*.scss'],function(event){
    	gulp.run('styles');
        server.notify(event);
    });


    gulp.watch(['app.js', 'routes/*.js'], [server.run]);
});

gulp.task('styles', function(){
	return sass('public/scss/' , {lineNumbers: true,style: 'expanded'})
		.on('error', function (err) {
	      console.error('Error', err.message);
	   	})
		.pipe(minifyCSS())
		.pipe(gulp.dest('public/css/'));
});

gulp.task('default', ['styles','server']);