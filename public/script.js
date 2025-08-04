window.onload = function() {
    // Initialize components
    const converter = new showdown.Converter({
        tables: true,
        strikethrough: true,
        tasklists: true,
        ghCodeBlocks: true,
        emoji: true,
        underline: true
    });
    
    // Initialize Mermaid
    mermaid.initialize({ 
        startOnLoad: true,
        theme: 'dark',
        securityLevel: 'loose'
    });
    
    // DOM Elements
    const pad = document.getElementById('pad');
    const markdownArea = document.getElementById('markdown');
    const userCountElement = document.getElementById('user-count');
    const lastSavedElement = document.getElementById('last-saved');
    const documentIdElement = document.getElementById('document-id');
    const versionInfoElement = document.getElementById('version-info');
    
    // UI Elements
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const downloadBtn = document.getElementById('download-btn');
    const clearBtn = document.getElementById('clear-btn');
    const togglePreviewBtn = document.getElementById('toggle-preview-btn');
    const previewPanel = document.querySelector('.preview-panel');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const searchBtn = document.getElementById('search-btn');
    const templateBtn = document.getElementById('template-btn');
    const historyBtn = document.getElementById('history-btn');
    const commentsBtn = document.getElementById('comments-btn');
    const mediaUploadBtn = document.getElementById('media-upload-btn');
    const mediaGalleryBtn = document.getElementById('media-gallery-btn');
    
    // Media elements
    const mediaGalleryPanel = document.getElementById('media-gallery-panel');
    const mediaUploadModal = document.getElementById('media-upload-modal');
    const uploadZone = document.getElementById('upload-zone');
    const mediaFileInput = document.getElementById('media-file-input');
    const mediaGalleryGrid = document.getElementById('media-gallery-grid');
    const uploadProgress = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const uploadStatus = document.getElementById('upload-status');
    const uploadPreview = document.getElementById('upload-preview');
    const uploadFilesBtn = document.getElementById('upload-files-btn');
    const cancelUploadBtn = document.getElementById('cancel-upload-btn');
    
    // Authentication elements
    const authSection = document.getElementById('auth-section');
    const userSection = document.getElementById('user-section');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const usernameDisplay = document.getElementById('username-display');
    
    // Modal elements
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const searchModal = document.getElementById('search-modal');
    const templateModal = document.getElementById('template-modal');
    const historyModal = document.getElementById('history-modal');
    const commentsPanel = document.getElementById('comments-panel');
    
    // Connect to Socket.IO
    const socket = io();
    const documentId = document.location.pathname.substring(1) || 'home';
    
    // State variables
    let userCount = 1;
    let isTyping = false;
    let typingTimeout;
    let currentUser = null;
    let authToken = localStorage.getItem('authToken');
    let currentTheme = localStorage.getItem('theme') || 'dark';
    
    // Update document ID in status bar
    documentIdElement.textContent = documentId;
    
    // Join the document room
    socket.emit('join-document', documentId);
    
    // Initialize UI
    initializeUI();
    initializeAuthentication();
    initializeTheme();
    initializeToolbar();
    initializeModals();
    initializeComments();
    
    function initializeUI() {
        // Fullscreen functionality
        fullscreenBtn.addEventListener('click', toggleFullscreen);
        
        // Download functionality
        downloadBtn.addEventListener('click', downloadMarkdown);
        
        // Clear functionality
        clearBtn.addEventListener('click', clearEditor);
        
        // Toggle preview functionality
        togglePreviewBtn.addEventListener('click', togglePreview);
        
        // Theme toggle
        themeToggleBtn.addEventListener('click', toggleTheme);
        
        // Search functionality
        searchBtn.addEventListener('click', () => showModal(searchModal));
        
        // Template functionality
        templateBtn.addEventListener('click', () => showModal(templateModal));
        
        // History functionality
        historyBtn.addEventListener('click', () => showModal(historyModal));
        
        // Comments functionality
        commentsBtn.addEventListener('click', toggleComments);
        
        // Media functionality
        mediaUploadBtn.addEventListener('click', () => showModal(mediaUploadModal));
        mediaGalleryBtn.addEventListener('click', toggleMediaGallery);
        
        // Keyboard shortcuts
        setupKeyboardShortcuts();
        
        // Auto-save indicator
        updateLastSaved();
    }
    
    function initializeAuthentication() {
        if (authToken) {
            // Validate token and set user
            validateToken(authToken);
        }
        
        loginBtn.addEventListener('click', () => showModal(loginModal));
        registerBtn.addEventListener('click', () => showModal(registerModal));
        logoutBtn.addEventListener('click', logout);
        
        // Form submissions
        document.getElementById('login-form').addEventListener('submit', handleLogin);
        document.getElementById('register-form').addEventListener('submit', handleRegister);
    }
    
    function initializeTheme() {
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateThemeIcon();
    }
    
    function initializeToolbar() {
        const toolbarBtns = document.querySelectorAll('.toolbar-btn');
        toolbarBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const insertText = btn.getAttribute('data-insert');
                insertAtCursor(pad, insertText);
                pad.focus();
            });
        });
    }
    
    function initializeModals() {
        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    hideModal(modal);
                }
            });
        });
        
        // Close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                hideModal(btn.closest('.modal'));
            });
        });
        
        // Template selection
        document.querySelectorAll('.template-item').forEach(item => {
            item.addEventListener('click', () => {
                const template = item.getAttribute('data-template');
                loadTemplate(template);
                hideModal(templateModal);
            });
        });
        
        // Search functionality
        document.getElementById('find-btn').addEventListener('click', findText);
        document.getElementById('replace-btn').addEventListener('click', replaceText);
        document.getElementById('replace-all-btn').addEventListener('click', replaceAllText);
        
        // Media functionality
        initializeMediaUpload();
        initializeDragAndDrop();
    }
    
    function initializeComments() {
        const commentsClose = document.querySelector('.comments-close');
        const addCommentBtn = document.getElementById('add-comment-btn');
        const newCommentInput = document.getElementById('new-comment');
        
        commentsClose.addEventListener('click', toggleComments);
        addCommentBtn.addEventListener('click', addComment);
        
        newCommentInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                addComment();
            }
        });
    }
    
    function initializeMediaUpload() {
        // File input change handler
        mediaFileInput.addEventListener('change', handleFileSelection);
        
        // Upload button handler
        uploadFilesBtn.addEventListener('click', uploadFiles);
        
        // Cancel upload handler
        cancelUploadBtn.addEventListener('click', () => {
            hideModal(mediaUploadModal);
            resetUploadForm();
        });
        
        // Close modal handler
        document.querySelector('#media-upload-modal .modal-close').addEventListener('click', () => {
            hideModal(mediaUploadModal);
            resetUploadForm();
        });
    }
    
    function initializeDragAndDrop() {
        // Drag and drop for upload zone
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });
        
        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            handleFiles(files);
        });
        
        // Drag and drop for editor
        pad.addEventListener('dragover', (e) => {
            e.preventDefault();
            pad.style.borderColor = 'var(--primary-color)';
        });
        
        pad.addEventListener('dragleave', (e) => {
            e.preventDefault();
            pad.style.borderColor = '';
        });
        
        pad.addEventListener('drop', (e) => {
            e.preventDefault();
            pad.style.borderColor = '';
            
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                handleFiles(files);
                showModal(mediaUploadModal);
            }
        });
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
            
            // Ctrl/Cmd + F to search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                showModal(searchModal);
            }
            
            // Ctrl/Cmd + T to toggle theme
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                toggleTheme();
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
    
    function insertAtCursor(textarea, text) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        
        textarea.value = value.substring(0, start) + text + value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
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
    
    function toggleTheme() {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
        updateThemeIcon();
        showNotification(`Switched to ${currentTheme} theme`, 'info');
    }
    
    function updateThemeIcon() {
        const icon = currentTheme === 'dark' ? 'moon' : 'sun';
        themeToggleBtn.innerHTML = `<i class="fas fa-${icon}"></i>`;
    }
    
    function showModal(modal) {
        modal.classList.add('show');
    }
    
    function hideModal(modal) {
        modal.classList.remove('show');
    }
    
    function toggleComments() {
        commentsPanel.classList.toggle('show');
    }
    
    function toggleMediaGallery() {
        mediaGalleryPanel.classList.toggle('show');
        if (mediaGalleryPanel.classList.contains('show')) {
            loadMediaGallery();
        }
    }
    
    // Media handling functions
    function handleFileSelection(e) {
        const files = Array.from(e.target.files);
        handleFiles(files);
    }
    
    function handleFiles(files) {
        const validFiles = files.filter(file => {
            const maxSize = 50 * 1024 * 1024; // 50MB
            if (file.size > maxSize) {
                showNotification(`File ${file.name} is too large (max 50MB)`, 'error');
                return false;
            }
            return true;
        });
        
        if (validFiles.length > 0) {
            showFilePreviews(validFiles);
            uploadFilesBtn.disabled = false;
        }
    }
    
    function showFilePreviews(files) {
        uploadPreview.innerHTML = '';
        
        files.forEach(file => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            let previewContent = '';
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewContent = `<img src="${e.target.result}" alt="${file.name}">`;
                    previewItem.innerHTML = `
                        ${previewContent}
                        <div class="preview-info">
                            <div class="preview-name">${file.name}</div>
                            <div class="preview-size">${formatFileSize(file.size)}</div>
                        </div>
                        <button class="preview-remove" onclick="removePreviewItem(this)">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                };
                reader.readAsDataURL(file);
            } else {
                const icon = getFileIcon(file.type);
                previewContent = `<div class="media-icon"><i class="${icon}"></i></div>`;
                previewItem.innerHTML = `
                    ${previewContent}
                    <div class="preview-info">
                        <div class="preview-name">${file.name}</div>
                        <div class="preview-size">${formatFileSize(file.size)}</div>
                    </div>
                    <button class="preview-remove" onclick="removePreviewItem(this)">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            }
            
            uploadPreview.appendChild(previewItem);
        });
    }
    
    function getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return 'fas fa-image';
        if (mimeType.startsWith('video/')) return 'fas fa-video';
        if (mimeType.startsWith('audio/')) return 'fas fa-music';
        if (mimeType.includes('pdf')) return 'fas fa-file-pdf';
        if (mimeType.includes('word')) return 'fas fa-file-word';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'fas fa-file-archive';
        return 'fas fa-file';
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function removePreviewItem(button) {
        button.closest('.preview-item').remove();
        if (uploadPreview.children.length === 0) {
            uploadFilesBtn.disabled = true;
        }
    }
    
    async function uploadFiles() {
        const files = Array.from(mediaFileInput.files);
        if (files.length === 0) return;
        
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });
        
        uploadProgress.style.display = 'block';
        uploadFilesBtn.disabled = true;
        uploadStatus.textContent = 'Uploading...';
        
        try {
            const response = await fetch('/api/upload-multiple', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Add media to document
                result.files.forEach(file => {
                    socket.emit('add-media', {
                        filename: file.filename,
                        url: file.fileUrl,
                        type: getFileType(file.filename),
                        size: file.size
                    });
                });
                
                showNotification(`${result.files.length} file(s) uploaded successfully!`, 'success');
                hideModal(mediaUploadModal);
                resetUploadForm();
                loadMediaGallery();
            } else {
                showNotification('Upload failed', 'error');
            }
        } catch (error) {
            showNotification('Upload failed: ' + error.message, 'error');
        } finally {
            uploadProgress.style.display = 'none';
            uploadFilesBtn.disabled = false;
        }
    }
    
    function getFileType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
        if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video';
        if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
        if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return 'document';
        if (['zip', 'rar', '7z'].includes(ext)) return 'archive';
        return 'unknown';
    }
    
    function resetUploadForm() {
        mediaFileInput.value = '';
        uploadPreview.innerHTML = '';
        uploadFilesBtn.disabled = true;
        uploadProgress.style.display = 'none';
    }
    
    async function loadMediaGallery() {
        try {
            const response = await fetch(`/api/document/${documentId}/media`);
            const data = await response.json();
            
            mediaGalleryGrid.innerHTML = '';
            
            if (data.media && data.media.length > 0) {
                data.media.forEach(media => {
                    displayMediaItem(media);
                });
            } else {
                mediaGalleryGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No media files yet</p>';
            }
        } catch (error) {
            showNotification('Failed to load media gallery', 'error');
        }
    }
    
    function displayMediaItem(media) {
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-item';
        mediaItem.setAttribute('data-media-id', media.id);
        
        let content = '';
        if (media.type === 'image') {
            content = `<img src="${media.url}" alt="${media.filename}" onclick="insertMediaIntoEditor('${media.url}', '${media.type}')">`;
        } else {
            const icon = getFileIconByType(media.type);
            content = `<div class="media-icon" onclick="insertMediaIntoEditor('${media.url}', '${media.type}')"><i class="${icon}"></i></div>`;
        }
        
        mediaItem.innerHTML = `
            ${content}
            <div class="media-name">${media.filename}</div>
            <div class="media-size">${formatFileSize(media.size)}</div>
            <div class="media-actions">
                <button class="media-action-btn" onclick="insertMediaIntoEditor('${media.url}', '${media.type}')" title="Insert">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="media-action-btn" onclick="deleteMedia('${media.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        mediaGalleryGrid.appendChild(mediaItem);
    }
    
    function getFileIconByType(type) {
        switch (type) {
            case 'image': return 'fas fa-image';
            case 'video': return 'fas fa-video';
            case 'audio': return 'fas fa-music';
            case 'document': return 'fas fa-file-alt';
            case 'archive': return 'fas fa-file-archive';
            default: return 'fas fa-file';
        }
    }
    
    function insertMediaIntoEditor(url, type) {
        let markdown = '';
        
        switch (type) {
            case 'image':
                markdown = `![Image](${url})`;
                break;
            case 'video':
                markdown = `![Video](${url})`;
                break;
            case 'audio':
                markdown = `[Audio File](${url})`;
                break;
            default:
                markdown = `[${url.split('/').pop()}](${url})`;
        }
        
        insertAtCursor(pad, markdown);
        pad.focus();
        showNotification('Media inserted into editor', 'success');
    }
    
    async function deleteMedia(mediaId) {
        if (!confirm('Are you sure you want to delete this media file?')) return;
        
        try {
            socket.emit('remove-media', { mediaId });
            showNotification('Media removed', 'success');
        } catch (error) {
            showNotification('Failed to remove media', 'error');
        }
    }
    
    // Authentication functions
    async function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                authToken = data.token;
                currentUser = data.user;
                localStorage.setItem('authToken', authToken);
                updateAuthUI();
                hideModal(loginModal);
                showNotification('Login successful!', 'success');
            } else {
                showNotification(data.error, 'error');
            }
        } catch (error) {
            showNotification('Login failed', 'error');
        }
    }
    
    async function handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                authToken = data.token;
                currentUser = data.user;
                localStorage.setItem('authToken', authToken);
                updateAuthUI();
                hideModal(registerModal);
                showNotification('Registration successful!', 'success');
            } else {
                showNotification(data.error, 'error');
            }
        } catch (error) {
            showNotification('Registration failed', 'error');
        }
    }
    
    function logout() {
        authToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        updateAuthUI();
        showNotification('Logged out successfully', 'info');
    }
    
    function updateAuthUI() {
        if (currentUser) {
            authSection.style.display = 'none';
            userSection.style.display = 'flex';
            usernameDisplay.textContent = currentUser.username;
        } else {
            authSection.style.display = 'flex';
            userSection.style.display = 'none';
        }
    }
    
    async function validateToken(token) {
        // In a real app, you'd validate the token with the server
        // For now, we'll just check if it exists
        if (token) {
            currentUser = { username: 'User' }; // Mock user
            updateAuthUI();
        }
    }
    
    // Search and replace functions
    function findText() {
        const searchInput = document.getElementById('search-input').value;
        const caseSensitive = document.getElementById('case-sensitive').checked;
        const wholeWord = document.getElementById('whole-word').checked;
        
        if (!searchInput) return;
        
        const text = pad.value;
        const searchRegex = new RegExp(
            wholeWord ? `\\b${searchInput}\\b` : searchInput,
            caseSensitive ? 'g' : 'gi'
        );
        
        const matches = text.match(searchRegex);
        if (matches) {
            showNotification(`Found ${matches.length} matches`, 'info');
            // Highlight matches (simplified)
            pad.focus();
        } else {
            showNotification('No matches found', 'warning');
        }
    }
    
    function replaceText() {
        const searchInput = document.getElementById('search-input').value;
        const replaceInput = document.getElementById('replace-input').value;
        const caseSensitive = document.getElementById('case-sensitive').checked;
        const wholeWord = document.getElementById('whole-word').checked;
        
        if (!searchInput) return;
        
        const text = pad.value;
        const searchRegex = new RegExp(
            wholeWord ? `\\b${searchInput}\\b` : searchInput,
            caseSensitive ? 'g' : 'gi'
        );
        
        const newText = text.replace(searchRegex, replaceInput);
        pad.value = newText;
        convertTextAreaToMarkdown();
        showNotification('Text replaced', 'success');
    }
    
    function replaceAllText() {
        const searchInput = document.getElementById('search-input').value;
        const replaceInput = document.getElementById('replace-input').value;
        const caseSensitive = document.getElementById('case-sensitive').checked;
        const wholeWord = document.getElementById('whole-word').checked;
        
        if (!searchInput) return;
        
        const text = pad.value;
        const searchRegex = new RegExp(
            wholeWord ? `\\b${searchInput}\\b` : searchInput,
            caseSensitive ? 'g' : 'gi'
        );
        
        const matches = text.match(searchRegex);
        if (matches) {
            const newText = text.replace(searchRegex, replaceInput);
            pad.value = newText;
            convertTextAreaToMarkdown();
            showNotification(`Replaced ${matches.length} occurrences`, 'success');
        } else {
            showNotification('No matches found', 'warning');
        }
    }
    
    // Template functions
    function loadTemplate(templateName) {
        const templates = {
            'blank': '',
            'meeting-notes': `# Meeting Notes

## Date: ${new Date().toLocaleDateString()}
## Attendees: 
## Agenda:
- 

## Discussion Points:
- 

## Action Items:
- [ ] 
- [ ] 
- [ ] 

## Next Meeting: `,
            'project-plan': `# Project Plan

## Project Overview
Brief description of the project goals and objectives.

## Timeline
- **Phase 1**: 
- **Phase 2**: 
- **Phase 3**: 

## Resources
- Team members:
- Budget:
- Tools:

## Milestones
- [ ] Milestone 1
- [ ] Milestone 2
- [ ] Milestone 3

## Risks & Mitigation
| Risk | Impact | Mitigation |
|------|--------|------------|
|      |        |            |`,
            'blog-post': `# Blog Post Title

## Introduction
Start with an engaging introduction that hooks the reader.

## Main Content
### Section 1
Your content here...

### Section 2
More content...

## Conclusion
Wrap up your thoughts and provide a call to action.

---
*Published on ${new Date().toLocaleDateString()}*`,
            'technical-doc': `# Technical Documentation

## Overview
Brief description of the system or feature being documented.

## Architecture
High-level architecture diagram and description.

## API Reference
### Endpoint 1
**Method**: GET  
**URL**: \`/api/endpoint\`  
**Parameters**: 
- \`param1\`: Description
- \`param2\`: Description

**Response**:
\`\`\`json
{
  "status": "success",
  "data": {}
}
\`\`\`

## Installation
\`\`\`bash
npm install package-name
\`\`\`

## Configuration
Describe configuration options...

## Troubleshooting
Common issues and solutions...`,
            'research-paper': `# Research Paper Title

## Abstract
Brief summary of the research, methodology, and findings.

## Introduction
Background and context of the research problem.

## Literature Review
Review of existing research and theoretical framework.

## Methodology
Description of research design, data collection, and analysis methods.

## Results
Presentation of findings with appropriate visualizations.

## Discussion
Interpretation of results and implications.

## Conclusion
Summary of key findings and future research directions.

## References
1. Author, A. (Year). Title. Journal, Volume(Issue), Pages.
2. Author, B. (Year). Title. Publisher.

---
*Submitted: ${new Date().toLocaleDateString()}*`
        };
        
        pad.value = templates[templateName] || '';
        convertTextAreaToMarkdown();
        showNotification(`Template "${templateName}" loaded`, 'success');
    }
    
    // Comments functions
    function addComment() {
        const commentText = document.getElementById('new-comment').value.trim();
        if (!commentText) return;
        
        socket.emit('add-comment', {
            text: commentText,
            position: pad.selectionStart
        });
        
        document.getElementById('new-comment').value = '';
        showNotification('Comment added', 'success');
    }
    
    function displayComment(comment) {
        const commentsList = document.getElementById('comments-list');
        const commentElement = document.createElement('div');
        commentElement.className = 'comment-item';
        commentElement.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">${comment.author}</span>
                <span class="comment-time">${new Date(comment.timestamp).toLocaleString()}</span>
            </div>
            <div class="comment-text">${comment.text}</div>
        `;
        commentsList.appendChild(commentElement);
    }
    
    // History functions
    async function loadHistory() {
        try {
            const response = await fetch(`/api/document/${documentId}/history`);
            const history = await response.json();
            
            const historyList = document.getElementById('history-list');
            historyList.innerHTML = '';
            
            history.forEach(item => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.innerHTML = `
                    <h4>Version ${item.version} by ${item.author}</h4>
                    <p>${new Date(item.timestamp).toLocaleString()}</p>
                `;
                historyItem.addEventListener('click', () => {
                    pad.value = item.content;
                    convertTextAreaToMarkdown();
                    hideModal(historyModal);
                    showNotification('Version restored', 'success');
                });
                historyList.appendChild(historyItem);
            });
        } catch (error) {
            showNotification('Failed to load history', 'error');
        }
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
    
    function updateVersionInfo(version) {
        versionInfoElement.textContent = `v${version}`;
    }
    
    // Convert text area to markdown html with enhanced features
    function convertTextAreaToMarkdown() {
        const markdownText = pad.value;
        let html = converter.makeHtml(markdownText);
        
        // Process Mermaid diagrams
        html = html.replace(/```mermaid\n([\s\S]*?)\n```/g, (match, code) => {
            try {
                const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
                return `<div class="mermaid" id="${id}">${code}</div>`;
            } catch (error) {
                return match;
            }
        });
        
        // Process media files with enhanced rendering
        html = processMediaFiles(html);
        
        markdownArea.innerHTML = html;
        
        // Render Mermaid diagrams
        mermaid.init(undefined, '.mermaid');
        
        // Re-render MathJax
        if (window.MathJax) {
            MathJax.typesetPromise([markdownArea]);
        }
        
        // Update last saved time
        updateLastSaved();
    }
    
    function processMediaFiles(html) {
        // Process image links to add captions and better styling
        html = html.replace(/<img([^>]+)>/g, (match, attrs) => {
            const srcMatch = attrs.match(/src="([^"]+)"/);
            const altMatch = attrs.match(/alt="([^"]*)"/);
            
            if (srcMatch) {
                const src = srcMatch[1];
                const alt = altMatch ? altMatch[1] : '';
                const filename = src.split('/').pop();
                
                return `
                    <div class="media-container">
                        <img${attrs}>
                        ${alt ? `<div class="media-caption">${alt}</div>` : ''}
                    </div>
                `;
            }
            return match;
        });
        
        // Process video links
        html = html.replace(/!\[Video\]\(([^)]+)\)/g, (match, url) => {
            return `
                <div class="media-container">
                    <video controls>
                        <source src="${url}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <div class="media-caption">Video: ${url.split('/').pop()}</div>
                </div>
            `;
        });
        
        // Process audio links
        html = html.replace(/\[Audio File\]\(([^)]+)\)/g, (match, url) => {
            return `
                <div class="media-container">
                    <audio controls>
                        <source src="${url}" type="audio/mpeg">
                        Your browser does not support the audio tag.
                    </audio>
                    <div class="media-caption">Audio: ${url.split('/').pop()}</div>
                </div>
            `;
        });
        
        return html;
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
            socket.emit('typing-start');
        }
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            isTyping = false;
            socket.emit('typing-stop');
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
    
    socket.on('new-comment', function(comment) {
        displayComment(comment);
    });
    
    socket.on('media-added', function(media) {
        if (mediaGalleryPanel.classList.contains('show')) {
            displayMediaItem(media);
        }
        showNotification(`Media added by ${media.addedBy}`, 'info');
    });
    
    socket.on('media-removed', function(media) {
        const mediaItem = document.querySelector(`[data-media-id="${media.id}"]`);
        if (mediaItem) {
            mediaItem.remove();
        }
        showNotification(`Media removed by ${media.addedBy}`, 'info');
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
        
        /* Mermaid diagram styling */
        .mermaid {
            background: var(--surface-light);
            padding: 1rem;
            border-radius: 0.5rem;
            margin: 1rem 0;
            text-align: center;
        }
        
        /* MathJax styling */
        .MathJax {
            color: var(--text-primary) !important;
        }
    `;
    document.head.appendChild(style);
    
    // Make functions globally available for HTML onclick handlers
    window.removePreviewItem = removePreviewItem;
    window.insertMediaIntoEditor = insertMediaIntoEditor;
    window.deleteMedia = deleteMedia;
}; 