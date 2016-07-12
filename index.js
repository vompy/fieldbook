'use strict';

var express = require('express');
var app = express();
var socket = require('socket.io');
var path = require('path');

var server = app.listen(process.env.PORT || 3000);
var io = socket.listen(server);
var config = {};

io.on('connection', (socket) => {
    console.log('Client connected');
    socket.on('disconnect', () => console.log('Client disconnected'));
    socket.on('incoming', function(data) {
       socket.broadcast.emit('incoming'); 
    });
    socket.on('image', function(image) {
        socket.broadcast.emit('image', image);
    });
    socket.on('received', function(data) {
        socket.broadcast.emit('received');
        console.log('received');
    });
    socket.on('clear', function(data) {
        socket.broadcast.emit('clear');
    });
    socket.on('draw_line', function(line_coords) {
        socket.broadcast.emit('draw_line', line_coords);
    });
    socket.on('pin_drop', function(pinpoint){
        socket.broadcast.emit('pin_drop', pinpoint);
    });
    socket.on('line_end', function(data) {
       socket.broadcast.emit('line_end'); 
    });
    socket.on('undo', function(data) {
       socket.broadcast.emit('undo', data); 
    });
    
});

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);

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