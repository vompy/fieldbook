/*

IV Javascript File

DO NOT CHANGE ANYTHING IN THIS FILE...non-related additions only

*/

//==========================================================================

// define web socket
var socket = io.connect();

// define image counter, set to 0
var count = 0;

// listen for 'tap' coming through web socket
// append a circle to the point that was tapped or clicked
// make adjustments so that the center of the circle is the same location as the tap or click
socket.on('tap', function(location) {
    $('#finger').remove();
    $('#img-container').append("<div id='finger'></div>")
    var $finger = $('#finger');
    $finger.css({
        backgroundColor: location.color,
        left: location.x * $('#image' + count).width() - $finger.width() / 2 + 'px',
        top: location.y * $('#image' + count).height() - $finger.height() / 2 + 'px'
    });
    
    console.log(location.color);
});

// listen for 'image' coming through web socket
// call image() 
socket.on('image', image);

// listen for 'delete image' coming through web socket
// remove all children of the 'img-container' div
socket.on('delete image', function() {
    $('#img-container').children().remove();
});

// when 'img-container' is tapped or clicked, emit the location through web socket 
// make appropriate adjustments
function getCoords(event) {    
    var $offset = $('#image' + count).offset();
    var location = {
        x: (event.pageX - $offset.left - $('#controls').width()) / $('#image' + count).width(),
        y: (event.pageY - $offset.top) / $('#image' + count).height(),
        color: $('#finger').css('background-color')
    };
    socket.emit('tap', location);
}

// increment image count by 1
// append the image to 'img-container' as an <img/>
function image(base64Image) {
    count++;
    $('#img-container').append('<img id="image' + count + '"onmousedown="getCoords(event)" src="' + base64Image + '"/>');
}

// =========================================================================

// do any setup on page load
function setUp() {
    
    var description = $(".description");	
    
    // create click event listeners for all the descriptions
    for (var i = 0; i < description.length; i++) {
        description[i].onclick = descriptionClicked;
    }
    
}

// change the style, and save the selection
function descriptionClicked() {

    // fetch the object that was clicked
    description_object = document.getElementById(this.id);
    description_border = description_object.style.border;

    // toggle the selection style
    if (description_border != "thin solid black") {
        description_object.style.border = "thin solid black";
    } else {
        description_object.style.border = "thin solid white";
    }
    
    	
	return;
}


window.onload = function () { 
  setUp();
}
