var express = require('express');
var app = express();
var socket = require('socket.io');
var path = require('path');

var server = app.listen(process.env.PORT || 3000);
var io = socket.listen(server);
var config = {};

io.on('connection', (socket) => {
    console.log('Client ' + socket.id + ' connected.');
    socket.on('disconnect', () => {
        console.log('Client ' + socket.id + ' disconnected.');
    });
    socket.on('incoming', function(data) {
       socket.broadcast.emit('incoming'); 
    });
    socket.on('image', function(image) {
        socket.broadcast.emit('image', image);
    });
    socket.on('received', function(data) {
        socket.broadcast.emit('received');
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
    socket.on('redo', function(data) {
       socket.broadcast.emit('redo', data); 
    });
});

app.use(express.static(__dirname + '/public'));

//views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});
