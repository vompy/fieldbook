/*
EV Javascript File
*/

// basic variable declarations
var socket = io.connect();
var $targetArea = $('#targetArea');

// listen for 'tap' coming through web socket
// append a circle to the point that was tapped or clicked
socket.on('tap', function(location) {
    $('#finger').remove();
    $('#container').append("<div id='finger'></div>")
    var $finger = $('#finger');
    $finger.css({
        left: location.x - $finger.width() / 2 + 'px',
        top: location.y - $finger.height() / 2 + 'px'
    });
});

// listen for 'user image' coming through web socket
// call image() 
socket.on('user image', image);
      
// when $targetArea is tapped or clicked, emit the location through web socket
function getCoords(event) {
    
    console.log('tap');
    
    var location = {
        x: event.clientX,
        y: event.clientY
    };
    socket.emit('tap', location); 
}

// emit the width of $targetArea through web socket
function getWidth() {
    var width = $targetArea.width();
    socket.emit('width', width);
}

// append the image to $targetArea as an <img/>
function image(base64Image) {
    $('body').append('<div id="container"><img id="image" onmousedown="getCoords(event)" src="' + base64Image + '"/></div>');
}

function takePicture() {
    $("#label").click();
    $('#camera-upload').css({
        visibility:'hidden'
    });
}

function tapListener() {
    $('#image').on('mousedown', getCoords(event));
}

// onload, call getWidth()
// onload, bind a 'change' event to the 'imageFile' input button
// the accompanying algorithm encodes it in a way that can pass through the web socket
$(function() {
    getWidth();
    $('#imagefile').bind('change', function(e){
      var data = e.originalEvent.target.files[0];
      var reader = new FileReader();
      reader.onload = function(evt){
        image(evt.target.result);
        socket.emit('user image', evt.target.result);
      };
      reader.readAsDataURL(data);
    });
    tapListener();
});