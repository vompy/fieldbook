'use strict';

var express = require('express');
var app = express();
var socket = require('socket.io');
var path = require('path');

var server = app.listen(process.env.PORT || 3000);
var io = socket.listen(server);
var config = {};

var queue = {
    lines: [],
    pins: []
};
var temp = [];
var redoStack = [];

io.on('connection', (socket) => {
    console.log('Client connected');
    socket.on('disconnect', () => console.log('Client disconnected'));
    socket.on('image', function (image) {
        socket.broadcast.emit('image', image);
    });
    socket.on('clear', function(data) {
        io.emit('clear');
    });
    socket.on('draw_line', function(line_coords) {
        socket.broadcast.emit('draw_line', line_coords);
        //temp = line_coords;
    });
    socket.on('line_end', function(previous_line){
        //queue.lines.push(temp);
        //temp = [];
    });
    socket.on('pin_drop', function(pinpoint){
        //queue.pins.push(pinpoint);
        socket.broadcast.emit('pin_drop', pinpoint);
    });
    socket.on('redraw', function(data) {
        //io.emit('redraw', queue);
    });
    
    socket.on('recording', function(data) {
       socket.broadcast.emit('recording'); 
    });
    
    socket.on('undo', function(data) {
        redoStack.push(queue.lines.pop());
        
        console.log('queue.lines[0] = ' + queue.lines[0]);
        console.log('queue.lines[1] = ' + queue.lines[1]);
        console.log('queue.lines[2] = ' + queue.lines[2]);

        console.log('////////////////////////////////////////////////////////////////////////////////////////////////');        
        
        console.log('redoStack[0] = ' + redoStack[0]);
        console.log('redoStack[1] = ' + redoStack[1]);
        console.log('redoStack[2] = ' + redoStack[2]);
        
        console.log('////////////////////////////////////////////////////////////////////////////////////////////////');        
        
        if(queue.lines.length > 0) {
            io.emit('redraw', queue);
        }
    });
    
    socket.on('redo', function(data) {
        
        queue.lines.push(redoStack.pop());
        
        console.log('queue.lines[0] = ' + queue.lines[0]);
        console.log('queue.lines[1] = ' + queue.lines[1]);
        console.log('queue.lines[2] = ' + queue.lines[2]);

        console.log('////////////////////////////////////////////////////////////////////////////////////////////////');
        
        console.log('redoStack[0] = ' + redoStack[0]);
        console.log('redoStack[1] = ' + redoStack[1]);
        console.log('redoStack[2] = ' + redoStack[2]);
        
        console.log('////////////////////////////////////////////////////////////////////////////////////////////////');        
        
        if(queue.lines.length > 0) {
            io.emit('redraw', queue);
        }
    });
});

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);

// app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

//views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/test', function(request, response) {
  response.render('pages/index');
});

app.get('/ev', function(request, response) {
  response.render('pages/ev');
});

app.get('/iv', function(request, response) {
  response.render('pages/iv');
});

// app.listen(PORT, function() {
//   console.log('Node app is running on port', PORT);
// });
