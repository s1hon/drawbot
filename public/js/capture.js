var width = 320;
var height = 0;

var streaming = false;

var video = null;
var canvas = null;
var photo = null;
var startbutton = null;
var my_strm = null;
var videostream = null;
var data_pic = null;

function startup() {

	startbutton = document.getElementById('startbutton');
	restartbutton = document.getElementById('restartbutton');
	usebutton = document.getElementById('usebutton');

	getMedia();

	startbutton.addEventListener('click', function(ev){
		takepicture();
		ev.preventDefault();
	}, false);

	restartbutton.addEventListener('click', function(ev){
		restart();
		ev.preventDefault();
	}, false);

	usebutton.addEventListener('click', function(ev){
		usepicture();
		ev.preventDefault();
	}, false);

}


function getMedia() {

	video = document.getElementById('video');
	canvas = document.getElementById('canvas');
	photo = document.getElementById('photo');

	navigator.getMedia = ( navigator.getUserMedia ||
	                       navigator.webkitGetUserMedia ||
	                       navigator.mozGetUserMedia ||
	                       navigator.msGetUserMedia);

	navigator.getMedia(
		{
		video: true,
		audio: false
		},
		function(stream) {
			videostream = stream;
			if (navigator.mozGetUserMedia) {
			  video.mozSrcObject = stream;
			} else {
			  var vendorURL = window.URL || window.webkitURL;
			  video.src = vendorURL.createObjectURL(stream);
			}
			video.play();
			$('.take_pic').toggle();
		},
		function(err) {
			console.log("An error occured! " + err);
			$('.cam-control').html('<p>[ERR]</p><p>無法啟動攝影機</p>');
		}
	);

	video.addEventListener('canplay', function(ev){
		if (!streaming) {
			height = video.videoHeight / (video.videoWidth/width);

			// Firefox currently has a bug where the height can't be read from
			// the video, so we will make assumptions if this happens.

			if (isNaN(height)) {
				height = width / (4/3);
			}

			video.setAttribute('width', width);
			video.setAttribute('height', height);
			canvas.setAttribute('width', width);
			canvas.setAttribute('height', height);
			streaming = true;
			}
	}, false);

}

// function clearphoto() {

//   var context = canvas.getContext('2d');
//   context.fillStyle = "#AAA";
//   context.fillRect(0, 0, canvas.width, canvas.height);

//   var data = canvas.toDataURL('image/png');
//   photo.setAttribute('src', data);

// }

function takepicture() {

	var context = canvas.getContext('2d');
	if (width && height) {
		canvas.width = width;
		canvas.height = height;
		context.drawImage(video, 0, 0, width, height);

		data_pic = canvas.toDataURL('image/png');

		$('#camera').html(' <img id="photo" class="cam-preview" src="'+data_pic+'"> ');
		videostream.stop();

		$('.take_pic').toggle();
		$('.chose_pic').toggle();
	}

}

function restart() {

	$('#camera').html('<video id="video">Video stream not available.</video>');
	$('.chose_pic').toggle();
	getMedia();

}

function usepicture() {
	$('.chose_pic').html('<p>請稍候....</p>');

	$.ajax({
		type: 'POST',
		url: '/upload',
        dataType:'json',
        contentType:'application/json',
		data: JSON.stringify({'data': data_pic}),
        success: function(msg){
			$('.chose_pic').html('<p>傳送成功。</p>');
        }
	});
	
}