/*

EV Javascript

*/

// basic variable declarations
var canvas = document.getElementById('canvas');
var clear = document.getElementById('clear');
var context = canvas.getContext('2d');
var socket = io.connect();
var takePhoto = document.getElementById('img-file');
var cameraIcon = document.getElementById('camera-upload');
var psuedoIcon = document.getElementById('label');
var container = document.getElementById('container');
var controls = document.getElementById('controls');
var newPhoto = document.getElementById('photo');
var buttons = document.getElementById('buttons');
var lines_to_draw = []; // Array of recieved lines to draw
var line_coords = []; // Array of local lines to be sent
var line_color = 'red';
const ratio = 4/3;

window.onload = function() {    
    resize();
    onLoadCallback();
}

window.onresize = function() {
    resize();
}

function resize() {
    if(getOrientation() == 'landscape') {
        $(canvas).remove();
        $(canvas).insertAfter(controls);
        $(canvas).removeClass('canvas-portrait');
        $(controls).removeClass('controls-portrait');
        $(buttons).children().removeClass('buttons-portrait');
        $(canvas).addClass('canvas-landscape');
        $(controls).addClass('controls-landscape');
        $(buttons).children().addClass('buttons-landscape');
        landscapeResize();
    } else { 
        $(controls).css({ height: '150px' });
        $(canvas).remove();
        $(canvas).insertBefore(controls);
        $(canvas).removeClass('canvas-landscape');
        $(controls).removeClass('controls-landscape');
        $(buttons).children().removeClass('buttons-landscape');
        $(canvas).addClass('canvas-portrait');
        $(controls).addClass('controls-portrait');
        $(buttons).children().addClass('buttons-portrait');
        portraitResize();
    }
}

function getOrientation() {
    if ($(window).width() >= $(window).height()) {
        return 'landscape';
    }
}

function landscapeResize() {
    var determingDimsension = 'height';
    var width, height;
    var availableWidth = $(container).width() - $(controls).width(); 
    var availableHeight = $(container).height(); 
    if(availableWidth < availableHeight * ratio) {
        determingDimsension = 'width';
    }
    if(determingDimsension == 'height') {
        height = $(container).height();
        width = height * ratio;
        canvas.height = height;
        canvas.width = width;
        $(controls).css({ height: height });
    } else if(determingDimsension == 'width') {
        width = availableWidth;
        height = width / ratio;
        canvas.height = height;
        canvas.width = width;
        $(controls).css({ height: height });
    }
}

function portraitResize() {
    var determingDimsension = 'height';
    var width, height;
    var availableWidth = $(container).width();
    var availableHeight = $(container).height(); 
    if(availableWidth < availableHeight * ratio) {
        determingDimsension = 'width';
    }
    if(determingDimsension == 'height') {
        height = (availableHeight - $(controls).height()) / ratio;
        width = availableWidth;
        canvas.height = height;
        canvas.width = width;
    } else if(determingDimsension == 'width') {
        width = availableWidth;
        height = width / ratio;
        canvas.height = height;
        canvas.width = width;
    }
}
            
function startSavingLineCoords(e) {
    e.preventDefault();
    context.lineTo((e.pageX - canvas.offsetLeft), (e.pageY - canvas.offsetTop)); // Draw line locally
    context.stroke();
    line_coords.push([(e.pageX - canvas.offsetLeft) / canvas.width, (e.pageY - canvas.offsetTop) / canvas.height]); // Add coords to be sent
    socket.emit('draw_line', line_color + ',' + line_coords.join(',')); // send line
}

function onLoadCallback () {
    // bool that tells whether drawing is happening 
    var drawing = false;

    socket.on('draw_line', function(line) { lines_to_draw.push(line); }); // Push recieved line in lines_to_draw
    // mouse events
    canvas.addEventListener('mousedown', function(e) {
        drawing = true;
        line_coords = [[(e.pageX - canvas.offsetLeft), (e.pageY - canvas.offsetTop)]]; // Starting coords for new line
        context.strokeStyle = line_color;
        context.beginPath(); // Start drawing locally
        context.moveTo((e.pageX - canvas.offsetLeft),(e.pageY - canvas.offsetTop));
        canvas.addEventListener('mousemove', startSavingLineCoords); // Start saving coords and drawing
    });
    canvas.addEventListener('mouseup', function(e) {
        drawing = false;
        canvas.removeEventListener('mousemove', startSavingLineCoords); // Stop saving local line coords
        socket.emit('draw_line', line_color + ',' + line_coords.join(',')); // send line
    });
    // touch events
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        drawing = true;
        line_coords = [[(e.pageX - canvas.offsetLeft), (e.pageY - canvas.offsetTop)]]; // Starting coords for new line
        context.strokeStyle = line_color;
        context.beginPath(); // Start drawing locally
        context.moveTo((e.pageX - canvas.offsetLeft), (e.pageY - canvas.offsetTop));
        canvas.addEventListener('touchmove', startSavingLineCoords); // Start saving coords and drawing
    });
    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        drawing = false;
        canvas.removeEventListener('touchmove', startSavingLineCoords); // Stop saving local line coords
        socket.emit('draw_line', line_color + ',' + line_coords.join(',')); // send line
    });

    setInterval(function() { // Every 50 ms draw all lines in lines_to_draw
        if(drawing) return; // wait for user to stop drawing line
        while(lines_to_draw.length > 0) { // Draw all lines in lines_to_draw
            var line_str = lines_to_draw.pop();
            var new_line = line_str.split(','); // new_line is in format color,x1,y1,x2,y2,x3,y3...
            context.strokeStyle = new_line[0]; // Color
            context.moveTo(new_line[1] * canvas.width, new_line[2] * canvas.height);
            context.beginPath();
            for(var i = 3; i < new_line.length; i += 2) {
                context.lineTo(new_line[i] * canvas.width, new_line[i + 1] * canvas.height);
            }
            context.stroke();
        }
    }, 50);
}

clear.onclick = function() { socket.emit('clear'); };
    
socket.on('clear', clearCanvas);    
    
socket.on('image', image);
     
clear.addEventListener('click', function() {
    socket.emit('clear');
});

 newPhoto.addEventListener('click', function() {
    $(psuedoIcon).click();
});

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);     
}

function image(base64Image) {
    $(cameraIcon).css('visibility', 'hidden');
    $(canvas).css('background-image', 'url(' + base64Image + ')');
    clearCanvas();
    $(controls).css('visibility', 'visible');
}

$(cameraIcon).click(function() {
    $(psuedoIcon).click(); 
});

$(takePhoto).bind('change', function(e){
    var data = e.originalEvent.target.files[0];
    var reader = new FileReader();
    reader.onload = function(evt) {
        image(evt.target.result);
        socket.emit('image', evt.target.result);
    };
    reader.readAsDataURL(data);
});