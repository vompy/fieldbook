/*

IV Javascript

*/

// basic variable declarations
var canvas = document.getElementById('canvas');
//var clear = document.getElementById('clear');
var context = canvas.getContext('2d');
var socket = io.connect();
var takePhoto = document.getElementById('img-file');
var cameraIcon = document.getElementById('camera-upload');
var psuedoIcon = document.getElementById('label');
var container = document.getElementById('container');
var controls = document.getElementById('controls');
//var newPhoto = document.getElementById('photo');
var buttons = document.getElementById('buttons');
//var undo = document.getElementById('undo');
//var redo = document.getElementById('redo');
var pin = document.getElementById('pin');
var draw = document.getElementById('draw');
var lines_to_draw = []; // Array of recieved lines to draw
var line_coords = []; // Array of local lines to be sent
var line_color = '#7FB2F0';
var lastAction = [];
var draw_bool = true;
var resizeTimer;
context.imageSmoothingEnabled = false;
var yellowPin_img = new Image();
yellowPin_img.src = '../assets/yellow-pin.png';
var bluePin_img = new Image();
bluePin_img.src = '../assets/blue-pin.png';
const ratio = 4/3;

window.onload = function() {    
    resize();
    onLoadCallback();
    //socket.emit('redraw');
}

window.onresize = function() {
    resize();
//    clearTimeout(resizeTimer);
//    resizeTimer = setTimeout(function() {
//    socket.emit('redraw');
//    }, 250);
}

socket.on('redraw', function redraw(data) {
    console.log(data.lines)
    context.clearRect(0, 0, canvas.width, canvas.height);     
    var line_str = data.lines.pop();
    var new_line = line_str.split(',');
    context.strokeStyle = new_line[0]; // Color
    context.moveTo(new_line[1] * canvas.width, new_line[2] * canvas.height);
    context.beginPath();
    for(var i = 3; i < new_line.length; i += 2) {
        context.lineTo(new_line[i] * canvas.width, new_line[i + 1] * canvas.height);
    }
    context.stroke();
});

socket.on('pin_drop', function(pinpoint) {
    pinDrop(pinpoint.color, pinpoint.x, pinpoint.y);
});

function pinDrop(color, x, y) {
    var img;
    if(color == 'yellow') {
        img = yellowPin_img;
    } else if(color == 'blue') {
        img = bluePin_img;
    }
    var pin_ratio = img.width / img.height;
    var width = canvas.width / 15;
    var height = width / pin_ratio;
    var left = x * canvas.width - width / 2;
    var top = y * canvas.height - height;
    console.log(left, top);
    context.drawImage(img, left, top, width, height);
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

function onLoadCallback() {
    // bool that tells whether drawing is happening 
    var drawing = false;

    socket.on('draw_line', function(line) { 
        lines_to_draw.push(line); // Push recieved line in lines_to_draw
    });
    
    // mouse events
    canvas.addEventListener('mousedown', function(e) {
        if(draw_bool) {
            drawing = true;
            line_coords = [[(e.pageX - canvas.offsetLeft), (e.pageY - canvas.offsetTop)]]; // Starting coords for new line
            context.strokeStyle = line_color;
            context.beginPath(); // Start drawing locally
            context.moveTo((e.pageX - canvas.offsetLeft), (e.pageY - canvas.offsetTop));
            canvas.addEventListener('mousemove', startSavingLineCoords); // Start saving coords and drawing
        } else {
            var pinpoint = {
                x: (e.pageX - canvas.offsetLeft) / canvas.width,
                y: (e.pageY - canvas.offsetTop) / canvas.height,
                color: 'blue'
            };
            pinDrop(pinpoint.color, pinpoint.x, pinpoint.y);
            socket.emit('pin_drop', pinpoint);
        }
    });
    canvas.addEventListener('mouseup', function(e) {
        if(draw_bool) {
            drawing = false;
            canvas.removeEventListener('mousemove', startSavingLineCoords); // Stop saving local line coords
            socket.emit('draw_line', line_color + ',' + line_coords.join(',')); // send line  
            lastAction.push('draw');
            socket.emit('line_end');
        }
    });
    // touch events
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if(draw_bool) {
            drawing = true;
            line_coords = [[(e.pageX - canvas.offsetLeft), (e.pageY - canvas.offsetTop)]]; // Starting coords for new line
            context.strokeStyle = line_color;
            context.beginPath(); // Start drawing locally
            context.moveTo((e.pageX - canvas.offsetLeft), (e.pageY - canvas.offsetTop));
            canvas.addEventListener('touchmove', startSavingLineCoords); // Start saving coords and drawing
        } else {
            var pinpoint = {
                x: (e.pageX - canvas.offsetLeft) / canvas.width,
                y: (e.pageY - canvas.offsetTop) / canvas.height,
                color: 'blue'
            };
            pinDrop(pinpoint.color, pinpoint.x, pinpoint.y);
            socket.emit('pin_drop', pinpoint);
        }
    });
    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        if(draw_bool) {
            drawing = false;
            canvas.removeEventListener('touchmove', startSavingLineCoords); // Stop saving local line coords
            socket.emit('draw_line', line_color + ',' + line_coords.join(',')); // send line  
            lastAction.push('draw');
            socket.emit('line_end');
        }
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

//clear.onclick = function() { socket.emit('clear'); };

//undo.onclick = function() { socket.emit('undo'); };

//redo.onclick = function() { socket.emit('redo'); };

pin.onclick = function() { draw_bool = false; };

draw.onclick = function() { draw_bool = true; };

socket.on('clear', clearCanvas);        

socket.on('image', image);

socket.on('recording', function(data) { alert('((( RECORDING )))'); });
     
//clear.addEventListener('click', function() {
//    socket.emit('clear');
//});

// newPhoto.addEventListener('click', function() {
//    $(psuedoIcon).click();
//});

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