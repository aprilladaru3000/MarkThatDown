window.onload = function() {
    // Initialize components
    const converter = new showdown.Converter({
        tables: true,
        strikethrough: true,
        tasklists: true,
        ghCodeBlocks: true
    });
    
    const pad = document.getElementById('pad');
    const markdownArea = document.getElementById('markdown');
    const userCountElement = document.getElementById('user-count');
    const lastSavedElement = document.getElementById('last-saved');
    const documentIdElement = document.getElementById('document-id');
    
    // UI Elements
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const downloadBtn = document.getElementById('download-btn');
    const clearBtn = document.getElementById('clear-btn');
    const togglePreviewBtn = document.getElementById('toggle-preview-btn');
    const previewPanel = document.querySelector('.preview-panel');
    
    // Connect to Socket.IO
    const socket = io();
    const documentId = document.location.pathname.substring(1) || 'home';
    
    // Update document ID in status bar
    documentIdElement.textContent = documentId;
    
    // Join the document room
    socket.emit('join-document', documentId);
    
    // User count tracking
    let userCount = 1;
    let isTyping = false;
    let typingTimeout;
    
    // Initialize UI
    initializeUI();
    
    function initializeUI() {
        // Fullscreen functionality
        fullscreenBtn.addEventListener('click', toggleFullscreen);
        
        // Download functionality
        downloadBtn.addEventListener('click', downloadMarkdown);
        
        // Clear functionality
        clearBtn.addEventListener('click', clearEditor);
        
        // Toggle preview functionality
        togglePreviewBtn.addEventListener('click', togglePreview);
        
        // Keyboard shortcuts
        setupKeyboardShortcuts();
        
        // Auto-save indicator
        updateLastSaved();
    }
    
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                downloadMarkdown();
            }
            
            // Ctrl/Cmd + Enter to toggle preview
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                togglePreview();
            }
            
            // Tab handling
            if (e.key === 'Tab' && e.target === pad) {
                e.preventDefault();
                insertTab();
            }
        });
    }
    
    function insertTab() {
        const start = pad.selectionStart;
        const end = pad.selectionEnd;
        const value = pad.value;
        
        pad.value = value.substring(0, start) + '\t' + value.substring(end);
        pad.selectionStart = pad.selectionEnd = start + 1;
    }
    
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            document.exitFullscreen();
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        }
    }
    
    function downloadMarkdown() {
        const content = pad.value;
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `markdown-${documentId}-${new Date().toISOString().slice(0, 10)}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Document exported successfully!', 'success');
    }
    
    function clearEditor() {
        if (confirm('Are you sure you want to clear the editor? This action cannot be undone.')) {
            pad.value = '';
            convertTextAreaToMarkdown();
            showNotification('Editor cleared', 'warning');
        }
    }
    
    function togglePreview() {
        const isHidden = previewPanel.style.display === 'none';
        previewPanel.style.display = isHidden ? 'flex' : 'none';
        togglePreviewBtn.innerHTML = isHidden ? 
            '<i class="fas fa-eye"></i>' : 
            '<i class="fas fa-eye-slash"></i>';
    }
    
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }
    
    function updateLastSaved() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        lastSavedElement.textContent = timeString;
    }
    
    function updateUserCount(count) {
        userCount = count;
        userCountElement.textContent = count;
    }
    
    // Convert text area to markdown html
    function convertTextAreaToMarkdown() {
        const markdownText = pad.value;
        const html = converter.makeHtml(markdownText);
        markdownArea.innerHTML = html;
        
        // Update last saved time
        updateLastSaved();
    }
    
    // Check if content has changed
    function hasContentChanged() {
        return pad.value !== previousMarkdownValue;
    }
    
    // Handle input changes
    pad.addEventListener('input', function() {
        convertTextAreaToMarkdown();
        
        // Debounce socket emission
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('document-change', {
                documentId: documentId,
                content: pad.value
            });
        }, 500);
        
        // Show typing indicator
        if (!isTyping) {
            isTyping = true;
            showNotification('Typing...', 'info');
        }
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            isTyping = false;
        }, 1000);
    });
    
    // Listen for updates from other users
    socket.on('document-update', function(content) {
        pad.value = content;
        convertTextAreaToMarkdown();
        showNotification('Document updated by another user', 'info');
    });
    
    // Socket event handlers
    socket.on('user-joined', function(data) {
        updateUserCount(data.userCount);
        showNotification(`${data.username || 'A user'} joined the document`, 'info');
    });
    
    socket.on('user-left', function(data) {
        updateUserCount(data.userCount);
        showNotification(`${data.username || 'A user'} left the document`, 'info');
    });
    
    socket.on('connect', function() {
        showNotification('Connected to server', 'success');
    });
    
    socket.on('disconnect', function() {
        showNotification('Disconnected from server', 'error');
    });
    
    // Auto-save every 30 seconds
    setInterval(function() {
        if (hasContentChanged()) {
            socket.emit('document-change', {
                documentId: documentId,
                content: pad.value
            });
        }
    }, 30000);
    
    // Convert on page load
    let previousMarkdownValue = '';
    convertTextAreaToMarkdown();
    previousMarkdownValue = pad.value;
    
    // Add notification styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 0.5rem;
            padding: 1rem 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            box-shadow: var(--shadow-lg);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            z-index: 1000;
            max-width: 300px;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification-success {
            border-left: 4px solid var(--success);
        }
        
        .notification-error {
            border-left: 4px solid var(--error);
        }
        
        .notification-warning {
            border-left: 4px solid var(--warning);
        }
        
        .notification-info {
            border-left: 4px solid var(--primary-color);
        }
        
        .notification i {
            font-size: 1.25rem;
        }
        
        .notification-success i {
            color: var(--success);
        }
        
        .notification-error i {
            color: var(--error);
        }
        
        .notification-warning i {
            color: var(--warning);
        }
        
        .notification-info i {
            color: var(--primary-color);
        }
    `;
    document.head.appendChild(style);
}; 