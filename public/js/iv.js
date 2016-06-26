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

var single_selection_list = ["alteration", "friability", "weathering"];
var toggle_on_style = "thin solid gray";
var toggle_off_style = "thin solid white";


// do any setup on page load
function setUp() {
    
    var description = $(".description");	
    
    // create click event listeners for all the descriptions
    for (var i = 0; i < description.length; i++) {
        description[i].onclick = descriptionClicked;
    }
    
    window.addEventListener("keydown", startTyping, false);
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

// give feedback that the selection has been made, and save the selection
function descriptionClicked() {
    
    // fetch the object that was clicked
    var description_object = document.getElementById(this.id);
    var description_border = description_object.style.border;

    // if it doesn't make sense for more than one selection to be made
    // unselect the others
    if (singleSelection(description_object.parentElement.id)) {
        toggleOffAllDescriptions(description_object.parentElement.id);
    }
    
    // toggle the selection style
    if (description_border != toggle_on_style) {
        description_object.style.border = toggle_on_style;
    } else {
        description_object.style.border = toggle_off_style;
    }
    	
	return;
}

// check if the given id is description that makes sense to have only one selection
function singleSelection(id) {
    
    var single_selection = false;
    
    // check if the description is in the single selection list
    if (single_selection_list.indexOf(id) == -1) {
        single_selection = false;
    } else{
        single_selection = true;
    }
    
    return single_selection;
}

// unselect any descriptions in the given container
function toggleOffAllDescriptions(id) {
    
    var parent_object = document.getElementById(id);
    var children = parent_object.childNodes;
    
    for(var i = 0; i < children.length; i++) {
        if (children[i].nodeName == "BUTTON") {
            children[i].style.border = toggle_off_style;
        }
    }
    
    return;
}


window.onload = function () { 
  setUp();
}
