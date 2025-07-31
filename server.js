var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

// set the view engine to ejs
app.set('view engine', 'ejs');

// public folder to store assets
app.use(express.static(__dirname + '/public'));

// routes for app
app.get('/', function(req, res) {
  res.render('pad');
});
app.get('/(:id)', function(req, res) {
  res.render('pad');
});

// Socket.IO connection handling
io.on('connection', function(socket) {
  console.log('A user connected');
  
  socket.on('join-document', function(documentId) {
    socket.join(documentId);
    console.log('User joined document:', documentId);
  });
  
  socket.on('document-change', function(data) {
    socket.to(data.documentId).emit('document-update', data.content);
  });
  
  socket.on('disconnect', function() {
    console.log('User disconnected');
  });
});

// listen on port 8000 (for localhost) or the port defined for heroku
var port = process.env.PORT || 8000;
http.listen(port, function() {
  console.log('Server running on port', port);
}); 