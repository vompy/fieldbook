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
  socket.on('width', function(data) {
        io.emit('width', data);
    });
    socket.on('user image', function (msg) {
        socket.broadcast.emit('user image', msg);
    });
    socket.on('tap', function(location) {
        io.emit('tap', location);
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
