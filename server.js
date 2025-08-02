var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var multer = require('multer');
var path = require('path');
var fs = require('fs');
var { v4: uuidv4 } = require('uuid');
var moment = require('moment');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// set the view engine to ejs
app.set('view engine', 'ejs');

// Store active documents and users
const activeDocuments = new Map();
const connectedUsers = new Map();
const documentHistory = new Map();
const userSessions = new Map();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// routes for app
app.get('/', function(req, res) {
  res.render('pad');
});

app.get('/(:id)', function(req, res) {
  res.render('pad');
});

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// API Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // In a real app, you'd check if user already exists
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    const user = {
      id: userId,
      username,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };
    
    // Store user (in production, use a database)
    userSessions.set(userId, user);
    
    const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ token, user: { id: userId, username, email } });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user (in production, query database)
    let user = null;
    for (let [userId, u] of userSessions) {
      if (u.email === email) {
        user = u;
        break;
      }
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ 
    success: true, 
    fileUrl,
    filename: req.file.originalname,
    size: req.file.size
  });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Document history endpoint
app.get('/api/document/:id/history', (req, res) => {
  const documentId = req.params.id;
  const history = documentHistory.get(documentId) || [];
  
  res.json(history.slice(-10)); // Return last 10 versions
});

// Export to PDF endpoint
app.post('/api/document/:id/export/pdf', async (req, res) => {
  try {
    const documentId = req.params.id;
    const document = activeDocuments.get(documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // In a real implementation, you'd use Puppeteer to generate PDF
    // For now, we'll return a success response
    res.json({ 
      success: true, 
      message: 'PDF export initiated',
      downloadUrl: `/api/document/${documentId}/download/pdf`
    });
  } catch (error) {
    res.status(500).json({ error: 'PDF export failed' });
  }
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
        lastModified: new Date(),
        version: 1,
        comments: []
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
        // Save to history before updating
        saveToHistory(currentDocumentId, document.content, currentUser.username);
        
        document.content = data.content;
        document.lastModified = new Date();
        document.version++;
        
        // Broadcast to other users in the same document
        socket.to(currentDocumentId).emit('document-update', data.content);
        
        console.log(`Document ${currentDocumentId} updated by ${currentUser.username}`);
      }
    }
  });
  
  socket.on('add-comment', function(data) {
    if (currentDocumentId) {
      const document = activeDocuments.get(currentDocumentId);
      if (document) {
        const comment = {
          id: uuidv4(),
          text: data.text,
          author: currentUser.username,
          timestamp: new Date(),
          position: data.position
        };
        
        document.comments.push(comment);
        
        // Broadcast comment to all users in document
        io.to(currentDocumentId).emit('new-comment', comment);
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
  
  function saveToHistory(documentId, content, author) {
    if (!documentHistory.has(documentId)) {
      documentHistory.set(documentId, []);
    }
    
    const history = documentHistory.get(documentId);
    history.push({
      version: history.length + 1,
      content: content,
      author: author,
      timestamp: new Date()
    });
    
    // Keep only last 50 versions
    if (history.length > 50) {
      history.shift();
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
      lastModified: document.lastModified,
      version: document.version,
      commentCount: document.comments.length
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