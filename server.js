var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

// set the view engine to ejs
app.set('view engine', 'ejs');

// public folder to store assets
app.use(express.static(__dirname + '/public'));

// Store active documents and users
const activeDocuments = new Map();
const connectedUsers = new Map();

// routes for app
app.get('/', function(req, res) {
  res.render('pad');
});

app.get('/(:id)', function(req, res) {
  res.render('pad');
});

// Socket.IO connection handling
io.on('connection', function(socket) {
  console.log('A user connected:', socket.id);
  
  let currentDocumentId = null;
  let currentUser = {
    id: socket.id,
    username: `User_${Math.random().toString(36).substr(2, 5)}`,
    joinedAt: new Date()
  };
  
  connectedUsers.set(socket.id, currentUser);
  
  socket.on('join-document', function(documentId) {
    // Leave previous document if any
    if (currentDocumentId) {
      socket.leave(currentDocumentId);
      leaveDocument(currentDocumentId, socket.id);
    }
    
    // Join new document
    currentDocumentId = documentId;
    socket.join(documentId);
    
    // Initialize document if it doesn't exist
    if (!activeDocuments.has(documentId)) {
      activeDocuments.set(documentId, {
        id: documentId,
        content: '',
        users: new Set(),
        createdAt: new Date(),
        lastModified: new Date()
      });
    }
    
    const document = activeDocuments.get(documentId);
    document.users.add(socket.id);
    
    console.log(`User ${currentUser.username} joined document: ${documentId}`);
    
    // Send current document content to the new user
    socket.emit('document-content', document.content);
    
    // Notify other users in the document
    socket.to(documentId).emit('user-joined', {
      username: currentUser.username,
      userCount: document.users.size
    });
    
    // Send current user count to the new user
    socket.emit('user-count-update', {
      userCount: document.users.size
    });
  });
  
  socket.on('document-change', function(data) {
    if (currentDocumentId && data.documentId === currentDocumentId) {
      const document = activeDocuments.get(currentDocumentId);
      if (document) {
        document.content = data.content;
        document.lastModified = new Date();
        
        // Broadcast to other users in the same document
        socket.to(currentDocumentId).emit('document-update', data.content);
        
        console.log(`Document ${currentDocumentId} updated by ${currentUser.username}`);
      }
    }
  });
  
  socket.on('typing-start', function() {
    socket.to(currentDocumentId).emit('user-typing', {
      username: currentUser.username
    });
  });
  
  socket.on('typing-stop', function() {
    socket.to(currentDocumentId).emit('user-stopped-typing', {
      username: currentUser.username
    });
  });
  
  socket.on('disconnect', function() {
    console.log('User disconnected:', socket.id);
    
    // Remove user from current document
    if (currentDocumentId) {
      leaveDocument(currentDocumentId, socket.id);
    }
    
    // Remove user from connected users
    connectedUsers.delete(socket.id);
  });
  
  function leaveDocument(documentId, userId) {
    const document = activeDocuments.get(documentId);
    if (document) {
      document.users.delete(userId);
      
      // Notify other users
      socket.to(documentId).emit('user-left', {
        username: currentUser.username,
        userCount: document.users.size
      });
      
      // Clean up empty documents
      if (document.users.size === 0) {
        activeDocuments.delete(documentId);
        console.log(`Document ${documentId} cleaned up (no users)`);
      }
    }
  }
});

// Health check endpoint
app.get('/health', function(req, res) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeDocuments: activeDocuments.size,
    connectedUsers: connectedUsers.size
  });
});

// API endpoint to get document info
app.get('/api/document/:id', function(req, res) {
  const documentId = req.params.id;
  const document = activeDocuments.get(documentId);
  
  if (document) {
    res.json({
      id: document.id,
      userCount: document.users.size,
      createdAt: document.createdAt,
      lastModified: document.lastModified
    });
  } else {
    res.status(404).json({ error: 'Document not found' });
  }
});

// listen on port 8000 (for localhost) or the port defined for heroku
var port = process.env.PORT || 8000;
http.listen(port, function() {
  console.log('Server running on port', port);
  console.log('MarkThatDown - Realtime Markdown Editor');
  console.log('Visit http://localhost:' + port);
}); 