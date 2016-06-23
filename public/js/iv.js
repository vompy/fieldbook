/*
IV Javascript File
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

// listen for 'width' coming through web socket
// set the width of the IV $targetArea to the same width as the reported EV $targetArea
socket.on('width', function(data) {
    $targetArea.css('width', data + 'px');
});

// listen for 'user image' coming through web socket
// call image() 
socket.on('user image', image);

// when $targetArea is tapped or clicked, emit the location through web socket       
function getCoords(event) {
    var location = {
        x: event.clientX,
        y: event.clientY
    };
    socket.emit('tap', location);   
}

// append the image to $targetArea as an <img/>
function image(base64Image) {
    $('body').append('<div id="container"><img id="image" onmousedown="getCoords(event)" src="' + base64Image + '"/></div>');
}

function tapListener() {
    $('#image').on('mousedown', getCoords(event));
}

// onload, bind a 'change' event to the 'imageFile' input button
// the accompanying algorithm encodes it in a way that can pass through the web socket
$(function() {
    $('#imagefile').bind('change', function(e){
        console.log('bind');
      var data = e.originalEvent.target.files[0];
      var reader = new FileReader();
      reader.onload = function(evt){
        image(evt.target.result);
        socket.emit('user image', evt.target.result);
      };
      reader.readAsDataURL(data);
    });
});