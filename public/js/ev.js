'use strict';

/*
EV/IV Javascript
*/

// basic variable declarations
var canvas = document.getElementById('canvas');
var clear = document.getElementById('clear');
var context = canvas.getContext('2d');
var socket = io.connect();
var takePhoto = document.getElementById('img-file');
var psuedoIcon = document.getElementById('label');
var container = document.getElementById('canvas-container');
var controls = document.getElementById('controls');
var newPhoto = document.getElementById('photo');
var buttons = document.getElementById('buttons');
var undo = document.getElementById('undo');
var pin = document.getElementById('pin');
var draw = document.getElementById('draw');
var loading = document.getElementById('loading-container');
var topDiv = document.getElementById('selection-container');

var inner_lineColor = '#ED1C24';
var outer_lineColor = '#FFF';
var pin_color = 'red';

var loadingMessages = ['No photo has been taken', 'sending photo', 'receiving photo', 'photo received'];

var inner_lineWidth = 3;

var redPin_img = new Image();
redPin_img.src = '../assets/red-pin.png';
var bluePin_img = new Image();
bluePin_img.src = '../assets/blue-pin.png';
var counter = 0;

const ratio = 4/3;
var draw_bool = true;
var drawing = false;

var lines_to_draw = []; // Array of recieved lines to draw in real time

var local_lines = []; // Array of local lines to store
var local_line_coords = []; // Array of local line coordinates to be sent

var received_lines = []; // Array of received lines to store
var received_line_coords = []; // Array of received line coordinates to store 

var local_pins = [];
var received_pins = [];

var undoStack = [];
var redoStack = [];

var lastAction = [];

var opts = { lines: 13, length: 13, width: 6, radius: 19, scale: 1, corners: 1, color: '#000', opacity: 0.25, rotate: 0, direction: 1, speed: 1, trail: 60, fps: 20, zIndex: 2e9, className: 'spinner', top: '50%', left: '50%', shadow: false, hwaccel: false, position: 'absolute' };

var spinner = new Spinner(opts);

var selection_container = document.getElementById('selection-container');
var role_selectors = document.getElementById('role-selection');
var camera_selector = document.getElementById('camera');
var camera_clickable = document.getElementById('camera-upload');
var ev = document.getElementById('ev');
var iv = document.getElementById('iv');
var role;

socket.on('clear', clearCanvas);        

socket.on('image', image);

socket.on('incoming', startSpin);

socket.on('received', stopSpin);

socket.on('pin_drop', function(pinpoint) {
    counter++;
    pinDrop(pinpoint.letter, pinpoint.color, pinpoint.x, pinpoint.y);
    received_pins.push(pinpoint);
});

socket.on('draw_line', function(line) { 
    lines_to_draw.push(line);
});

socket.on('line_end', function() {
    received_lines.push(received_line_coords);
});

socket.on('undo', function(data) {
    if(data.action === 'draw') {
        received_lines.pop();
    } else if(data.action === 'pin') {
        counter--;
        received_pins.pop();
    }    
    redrawAll();
});

function addButtonListeners() {
    pin.addEventListener('click', drawFalse);
    draw.addEventListener('click', drawTrue);
    clear.addEventListener('click', clearAll);
    undo.addEventListener('click', localRedraw);
    newPhoto.addEventListener('click', cameraClick);
    ev.addEventListener('click', roleSelection);
    iv.addEventListener('click', roleSelection);
}

function addCanvasListeners() {
    canvas.addEventListener('mousedown', mousedown);  
    canvas.addEventListener('mouseup', mouseup);
    canvas.addEventListener('touchstart', touchstart);
    canvas.addEventListener('touchend', touchend);
}

function removeButtonListeners() {
    pin.removeEventListener('click', drawFalse);
    draw.removeEventListener('click', drawTrue);
    clear.removeEventListener('click', clearAll);
    undo.removeEventListener('click', localRedraw);
    newPhoto.removeEventListener('click', cameraClick);
}

function removeCanvasListeners() {
    canvas.removeEventListener('mousedown', mousedown);  
    canvas.removeEventListener('mouseup', mouseup);
    canvas.removeEventListener('touchstart', touchstart);
    canvas.removeEventListener('touchend', touchend);
}

function roleSelection() {
    role = this.id;
    if(role === 'iv') {
        $(selection_container).addClass('hidden');
    } else if (role === 'ev') {
        $(role_selectors).addClass('hidden');
        $(camera_selector).removeClass('hidden');
    }
    setupIVControls();
    socket.emit('role', role);
    resize();
}

function setupIVControls() {
    if(role === 'iv') {
        inner_lineColor = '#29ABE2';
        pin_color = 'blue';
        $(newPhoto).addClass('hidden');
        $(pin).attr('src', '/assets/blue-pin.svg');
        $(draw).attr('src', '/assets/blue-scribble.svg');
        $(loading).removeClass('hidden');
        $(loading).addClass('visible');
        $('#message').append(loadingMessages[0]);
    }
}

window.onload = function() { 
    resize();
    setupLoadingContainer();
    addButtonListeners();
    addCanvasListeners();
    incomingLines();
}

window.onresize = function() {
    resize();
    setupLoadingContainer();
    redrawAll();
}

function pinDrop(letter, color, x, y) {
    var img;
    if(color === 'red') {
        img = redPin_img;
    } else if(color === 'blue') {
        img = bluePin_img;
    }
    var pin_ratio = img.width / img.height;
    var width = canvas.width / 20;
    var height = width / pin_ratio;
    var left = x * canvas.width - width / 2;
    var top = y * canvas.height - height;
    context.shadowBlur = 0;
    context.drawImage(img, left, top, width, height);
    var font_size = width / 2;
    context.font = font_size + 'px Myriad Pro';
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillStyle = '#FFF';
    context.fillText(letter, left + width / 2, top + height / 2.75);
}

function resize() {
    if(getOrientation() === 'landscape') {
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
    if(determingDimsension === 'height') {
        height = $(container).height();
        width = height * ratio;
        canvas.height = height;
        canvas.width = width;
        $(controls).css({ height: height });
    } else if(determingDimsension === 'width') {
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
    if(determingDimsension === 'height') {
        height = (availableHeight - $(controls).height()) / ratio;
        width = availableWidth;
        canvas.height = height;
        canvas.width = width;
    } else if(determingDimsension === 'width') {
        width = availableWidth;
        height = width / ratio;
        canvas.height = height;
        canvas.width = width;
    }
}
            
function startSavingLineCoords(e) {
    e.preventDefault();
    e.stopPropagation();
    if(draw_bool) {
        if(detectNonAppleMobile()) {
            context.lineTo((e.touches[0].pageX - canvas.offsetLeft), (e.touches[0].pageY - canvas.offsetTop)); // Draw line locally
            context.stroke();
            local_line_coords.push([(e.touches[0].pageX - canvas.offsetLeft) / canvas.width, (e.touches[0].pageY - canvas.offsetTop) / canvas.height]); // Add coords to be sent
        } else {
            context.lineTo((e.pageX - canvas.offsetLeft), (e.pageY - canvas.offsetTop)); // Draw line locally
            context.stroke();
            local_line_coords.push([(e.pageX - canvas.offsetLeft) / canvas.width, (e.pageY - canvas.offsetTop) / canvas.height]); // Add coords to be sent
        }
        local_lines = inner_lineColor + ',' + local_line_coords.join(',');
        socket.emit('draw_line', local_lines); // send line
    }
}

function incomingLines() {
    setInterval(function() { // Every 50 ms draw all lines in lines_to_draw
        if(drawing) return; // wait for user to stop drawing line
        while(lines_to_draw.length > 0) { // Draw all lines in lines_to_draw
            var line_str = lines_to_draw.pop();
            var line_coords = line_str.split(','); // new_line is in format color,x1,y1,x2,y2,x3,y3...
            received_line_coords = line_coords;
            contextSettings(line_coords[0], inner_lineWidth);
            context.moveTo(line_coords[1] * canvas.width, line_coords[2] * canvas.height);
            context.beginPath();
            for(var i = 3; i < line_coords.length; i += 2) {
                context.lineTo(line_coords[i] * canvas.width, line_coords[i + 1] * canvas.height);
            }
            context.stroke();
        }
    }, 10);
}

function localRedraw() {
    if(lastAction.length > 0 && (undoStack.length > 0 || local_pins.length > 0)) { // Draw all lines in undoStack
        if(lastAction[lastAction.length - 1] === 'draw') {
            undoStack.pop();
        } else if(lastAction[lastAction.length - 1] === 'pin') {
            counter--;
            local_pins.pop();
        }
        var event = {
            lines: coordsToLines(undoStack),
            action: lastAction[lastAction.length - 1]
        }
        redrawAll();
        socket.emit('undo', event);
        lastAction.pop();
    }
}

function redrawLocalPins() {
    if(local_pins.length > 0) {
        for(var i = 0; i < local_pins.length; i++) {
            pinDrop(local_pins[i].letter, local_pins[i].color, local_pins[i].x, local_pins[i].y);
        }
    }
}

function redrawReceivedPins() {
    if(received_pins.length > 0) {
        for(var i = 0; i < received_pins.length; i++) {
            pinDrop(received_pins[i].letter, received_pins[i].color, received_pins[i].x, received_pins[i].y);
        }
    }
}

function coordsToLines(array) {
    var lines = [];
    for(var i = 0; i < array.length; i++) {
        lines.push(array[i].split(','));
    }
    return lines;
}

function redrawLines(lines) {
    for(var i = 0; i < lines.length; i++) {
        contextSettings(lines[i][0], inner_lineWidth);
        context.moveTo(lines[i][1] * canvas.width, lines[i][2] * canvas.height);
        context.beginPath();
        for(var j = 3; j < lines[i].length; j += 2) {
            context.lineTo(lines[i][j] * canvas.width, lines[i][j + 1] * canvas.height);
            context.stroke();
        }
    }
    return lines;
}

function redrawAll() {
    clearCanvas();
    if(undoStack.length > 0) { // Draw all lines in undoStack
        redrawLines(coordsToLines(undoStack));
    }
    redrawLines(received_lines);
    redrawLocalPins();
    redrawReceivedPins();
}

function drawTrue() {
    draw_bool = true;
}

function drawFalse() {
    draw_bool = false;
}

function cameraClick() {
    $(selection_container).addClass('hidden');
    $(loading).addClass('visible');
    $('#message').append(loadingMessages[0]);
    $(psuedoIcon).click(); 
}

function clearAll() {
    if(lastAction.length > 0 && lastAction[lastAction.length - 1] !== 'clear') {
        lastAction.push('clear');
    }
    clearCanvas();
    socket.emit('clear');
}

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);     
}

function image(base64Image) {
    local_lines = [];
    undoStack = [];
    redoStack = [];
    received_line_coords = [];
    received_lines = [];
    local_pins = []; 
    received_pins = [];
    lastAction = [];
    $(canvas).css('background-image', 'url(' + base64Image + ')');
    clearCanvas();
    $(controls).css('visibility', 'visible');
    window.scrollTo(0, 0);
    if(role === 'iv') {
        stopSpin();
        socket.emit('received');
    }
}

function toLetters(num) {
    var mod = num % 26;
    var pow = num / 26 | 0;
    var out = mod ? String.fromCharCode(64 + mod) : (--pow, 'Z');
    return pow ? toLetters(pow) + out : out;
}

$(takePhoto).bind('change', function(e){
    socket.emit('incoming');
    var data = e.originalEvent.target.files[0];
    var reader = new FileReader();
    reader.onload = function(evt) {
        image(evt.target.result);
        socket.emit('image', evt.target.result);
    };
    reader.readAsDataURL(data);
    startSpin();
});

function detectNonAppleMobile() { 
 if(navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i)) {
    return true;
  } else {
    return false;
  }
}

document.ontouchmove = function(e) {
    e.preventDefault();    
    e.stopPropagation();
}

function startSpin() {
    spinner.spin(loading);
    removeButtonListeners();
    removeCanvasListeners();
    $(loading).addClass('visible');
    if(role === 'ev') {
        $(loading).css({
            backgroundColor: 'rgba(255, 255, 255, 0.75)'
        });
        $('#message').contents().filter(function(){ return this.nodeType != 1; }).remove();
        $('#message').append(loadingMessages[1]);
        $('#message').css({
            top: '135px',
            color: '#000'
        });
    } else {
        $('#message').contents().filter(function(){ return this.nodeType != 1; }).remove();
        $('#message').append(loadingMessages[2]);
        $('#message').css('top', '135px');
    }
}

function stopSpin() {
    addButtonListeners();
    addCanvasListeners();
    spinner.stop();
    if(role === 'ev') {
        $('#message').contents().filter(function(){ return this.nodeType != 1; }).remove();
        animateCheckmark();
    } else {
        $('#message').contents().filter(function(){ return this.nodeType != 1; }).remove();
        $(loading).removeClass('visible');
        $(loading).addClass('hidden');    
    }
}

function mousedown(e) {
    if(draw_bool) {
        drawing = true;
        startDrawingLine(e.pageX, e.pageY, inner_lineWidth, inner_lineColor);     
        canvas.addEventListener('mousemove', startSavingLineCoords); // Start saving coords and drawing
    } else {
        counter++;
        var pinpoint = {
            letter: toLetters(counter),
            x: (e.pageX - canvas.offsetLeft) / canvas.width,
            y: (e.pageY - canvas.offsetTop) / canvas.height,
            color: pin_color
        };
        pinDrop(pinpoint.letter, pinpoint.color, pinpoint.x, pinpoint.y);
        local_pins.push(pinpoint);
        socket.emit('pin_drop', pinpoint);
        lastAction.push('pin');
    }
}

function mouseup() {
    if(draw_bool) {
        drawing = false;
        canvas.removeEventListener('mousemove', startSavingLineCoords); // Stop saving local line coords
        undoStack.push(local_lines);
        socket.emit('line_end');
        lastAction.push('draw');
    }
}

function touchstart(e) {
    if(draw_bool) {
        e.preventDefault();
        e.stopPropagation();
        drawing = true;
        startDrawingLine(e.pageX, e.pageY, inner_lineWidth, inner_lineColor);        
        canvas.addEventListener('touchmove', startSavingLineCoords); // Start saving coords and drawing
    
    } else {
        counter++;
        var pinpoint = {
            letter: toLetters(counter),
            x: (e.pageX - canvas.offsetLeft) / canvas.width,
            y: (e.pageY - canvas.offsetTop) / canvas.height,
            color: pin_color
        };
        pinDrop(pinpoint.letter, pinpoint.color, pinpoint.x, pinpoint.y);
        local_pins.push(pinpoint);
        socket.emit('pin_drop', pinpoint);
        lastAction.push('pin');
    }
}

function touchend(e) {
    if(draw_bool) {
        e.preventDefault();
        e.stopPropagation();
        drawing = false;
        canvas.removeEventListener('touchmove', startSavingLineCoords); // Stop saving local line coords
        undoStack.push(local_lines);
        socket.emit('line_end');
        lastAction.push('draw');
    }
}

function startDrawingLine(x, y, width, color) {
    local_line_coords = [[(x - canvas.offsetLeft), (y - canvas.offsetTop)]]; // Starting coords for new line
    contextSettings(color, width);
    context.beginPath(); // Start drawing locally
    context.moveTo((x - canvas.offsetLeft), (y - canvas.offsetTop));
}

function contextSettings(color, width) {
    context.strokeStyle = color;
    context.lineWidth = width;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.shadowBlur = 1;
    context.shadowColor = '#FFF';   
}

function setupLoadingContainer() {
    $(loading).css({
        top: canvas.clientTop + 'px',
        left: canvas.offsetLeft - 8 + 'px',
        height: canvas.height + 'px',
        width: canvas.width + 'px'
    });
}

var circle = document.getElementById('circle');
var polyline = document.getElementById('polyline');
var checkmark = document.getElementById('checkmark');

function animateCheckmark() {
    $(checkmark).addClass('visible');
    $(circle).css({
        animation: 'dash 2s ease-in-out',
        '-webkit-animation': 'dash 2s ease-in-out'
    });
    $(polyline).css({
        animation: 'dash 2s ease-in-out',
        '-webkit-animation': 'dash 2s ease-in-out'
    });
    $('#message').append(loadingMessages[3]);
    $('#message').css({
        top: '175px',
        color: '#009245'
    });
    setTimeout(function() {
        $(checkmark).removeClass('visible');
        $(checkmark).addClass('hidden');
        $(loading).removeClass('visible');
        $(loading).addClass('hidden');
        $('#message').contents().filter(function(){ return this.nodeType != 1; }).remove();
        $(circle).css({
            animation: '',
            '-webkit-animation': ''
        });
        $(polyline).css({
            animation: '',
            '-webkit-animation': ''
        });
    }, 1500);
}