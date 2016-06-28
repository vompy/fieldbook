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

// var single_selection_list = ["alteration", "friability", "weathering"];
// var toggle_on_style = "thin solid gray";
// var toggle_off_style = "thin solid white";


// do any setup on page load
function setUp() {
    
    // create an event listener for any keys being pressed
    window.addEventListener("keydown", startTyping, false);
    
    // create an event listener for the submit
	var submit_button = $("#submit");
	submit_button[0].onclick = submitClicked;
}

// clear the form
function submitClicked() {
    var description_container = document.getElementById("description_container");
    
    // reset all the description selections
    $('button').removeClass('active');

    // clear the notes field
    var notes = document.getElementById("notes_field");
    notes.value = "";
}

// give the notes field focus if the user ever starts typing
function startTyping(e) {
    
    if (
        e.keyCode >= 48 && e.keyCode <= 90 ||   // numbers and letters
        e.keyCode >= 96 && e.keyCode <= 111 ||  // numpad and operators
        e.keyCode >= 186 && e.keyCode <= 222    // punctuation
        ) 
    {
        document.getElementById("notes_field").focus();
    }
}

var myStringArray = ['alteration', 'color', 'gradient', 'friability', 'presenceof', 'surfacecondition', 'texture', 'weathering'];

for (var i = 0; i < myStringArray.length; i++) {
    // alert(myStringArray[i]);
    $(document).on('click', '#' + myStringArray[i] +' button', function() {
       $(this).parent().children('button').not(this).removeClass('active');
       $(this).addClass("active");
    });
}

window.onload = function () { 
  setUp();
}
