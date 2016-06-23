/*
EV Javascript File
*/

// basic variable declarations
var socket = io.connect();
var count = 0;
var color = 'rgb(255, 255, 0)';

// listen for 'tap' coming through web socket
// append a circle to the point that was tapped or clicked
socket.on('tap', function(location) {
    $('#finger').remove();
    $('#img-container').append("<div id='finger'></div>")
    var $finger = $('#finger');
    $finger.css({
        backgroundColor: location.color,
        left: location.x * $('#image' + count).width() + $('#controls').width() - $finger.width() / 2 + 'px',
        top: location.y * $('#image' + count).height() - $finger.height() / 2 + 'px'
    });
});

// listen for 'user image' coming through web socket
// call image() 
socket.on('image', image);

socket.on('delete image', function() {
    $('#img-container').children().remove();
});
      
// when $targetArea is tapped or clicked, emit the location through web socket
function getCoords(event) {    
    var $offset = $('#image' + count).offset();
    var location = {
        x: (event.pageX - $offset.left) / $('#image' + count).width(),
        y: (event.pageY - $offset.top) / $('#image' + count).height(),
        color: color
    };
    socket.emit('tap', location);
}

// append the image to $targetArea as an <img/>
function image(base64Image) {
    $('#img-container').append('<img id="image' + count + '"onmousedown="getCoords(event)" src="' + base64Image + '"/>');
}

function takePicture() {
    $('#label').click();
    count++;
    setTimeout(function() {
        $('#camera-upload').css({
            position: 'relative',
            width: '80%',
            height: 'auto'
        });
        $('.tap-color').css({
            visibility: 'visible'
        });
    }, 1000);
    if(count > 0) {
        socket.emit('delete image');
    }
}

// onload, call getWidth()
// onload, bind a 'change' event to the 'imageFile' input button
// the accompanying algorithm encodes it in a way that can pass through the web socket
$(function() {
    document.ontouchmove = function(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    $('#imageFile').bind('change', function(e){
      var data = e.originalEvent.target.files[0];
      var reader = new FileReader();
      reader.onload = function(evt){
        image(evt.target.result);
        socket.emit('image', evt.target.result);
      };
      reader.readAsDataURL(data);
    });
    
    $('.tap-color').click(function() {
        color = $(this).css('background-color');
        $('.tap-color').css('opacity', '0.4');
        $(this).css('opacity', '1.0');
    }); 
});