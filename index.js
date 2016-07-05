'use strict';

var express = require('express');
var app = express();
var socket = require('socket.io');
var path = require('path');

var server = app.listen(process.env.PORT || 3000);
var io = socket.listen(server);
var config = {};

var images = [];

var recent_line = [];
var recent_pin = [];

var queue = {
    lines: [],
    pins: []
};

io.on('connection', function(socket) {
    console.log('Client connected: ' + socket.id);

    socket.on('disconnect', () => console.log('Client disconnected'));
    
    socket.on('image', function(image) {
        socket.broadcast.emit('image', image);
        images.push(image);
    });
    
    socket.on('clear', function(data) {
        io.emit('clear');
    });
    
    socket.on('draw_line', function(line_coords) {
        socket.broadcast.emit('draw_line', line_coords);
    });
    
    socket.on('previous_line', function(previous_line) {
        recent_line = previous_line;
    });
    
    socket.on('line_end', function(data){
        queue.lines.push(recent_line);
    });
    
    socket.on('pin_drop', function(data){
        queue.pins.push(data);
    });
    
    socket.on('redraw', function(data) {
        io.emit('redraw', queue);
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
