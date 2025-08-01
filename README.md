# MarkThatDown

A modern, real-time collaborative markdown editor with a beautiful dark theme UI.

![MarkThatDown](https://img.shields.io/badge/MarkThatDown-Realtime%20Markdown%20Editor-blue)
![Node.js](https://img.shields.io/badge/Node.js-14.0.0+-green)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7.2+-orange)

## ✨ Features

- **Real-time Collaboration**: Multiple users can edit the same document simultaneously
- **Live Preview**: See your markdown rendered in real-time as you type
- **Modern Dark UI**: Beautiful dark theme with smooth animations
- **Export Functionality**: Download your markdown files with one click
- **Fullscreen Mode**: Toggle fullscreen for distraction-free editing
- **Keyboard Shortcuts**: 
  - `Ctrl/Cmd + S`: Export document
  - `Ctrl/Cmd + Enter`: Toggle preview panel
  - `Tab`: Insert tab character
- **User Tracking**: See how many users are currently editing
- **Auto-save**: Automatic saving every 30 seconds
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Document Sharing**: Share documents via URL (e.g., `/my-document`)

## 🚀 Quick Start

### Prerequisites

- Node.js 14.0.0 or higher
- npm 6.0.0 or higher

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/MarkThatDown.git
cd MarkThatDown
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and visit:
```
http://localhost:8000
```

## 📖 Usage

### Basic Usage

1. **Start Editing**: Simply start typing in the editor panel
2. **Live Preview**: Your markdown will be rendered in real-time in the preview panel
3. **Collaboration**: Share the URL with others to collaborate in real-time
4. **Export**: Click the "Export" button to download your markdown file

### Document Sharing

- **Home Document**: Visit `/` for the default document
- **Custom Documents**: Visit `/{document-id}` to create or join a specific document
- **Examples**: 
  - `/meeting-notes` for meeting notes
  - `/project-docs` for project documentation
  - `/ideas` for brainstorming

### Markdown Features

The editor supports all standard markdown syntax:

```markdown
# Headers
## Subheaders

**Bold text**
*Italic text*

- Bullet points
- Lists

1. Numbered lists
2. Second item

[Links](https://example.com)

![Images](image.jpg)

`Inline code`

```javascript
// Code blocks
function hello() {
    console.log("Hello World!");
}
```

> Blockquotes

| Tables | Are | Cool |
|--------|-----|------|
| Data   | In  | Rows |

~~Strikethrough~~

- [x] Task lists
- [ ] Unchecked items
```

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.IO
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Markdown Parser**: Showdown.js
- **UI Framework**: Custom CSS with CSS Variables
- **Icons**: Font Awesome 6
- **Fonts**: Inter (Google Fonts)

## 📁 Project Structure

```
MarkThatDown/
├── server.js          # Express server with Socket.IO
├── package.json       # Dependencies and scripts
├── views/
│   └── pad.ejs       # Main HTML template
├── public/
│   ├── style.css      # Modern CSS styling
│   └── script.js      # Frontend JavaScript
└── README.md         # This file
```

## 🔧 Configuration

### Environment Variables

- `PORT`: Server port (default: 8000)

### Customization

You can customize the appearance by modifying the CSS variables in `public/style.css`:

```css
:root {
    --primary-color: #6366f1;
    --background: #0f172a;
    --surface: #1e293b;
    /* ... more variables */
}
```

## 🚀 Deployment

### Heroku

1. Create a Heroku app
2. Add the following to your `package.json`:
```json
{
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
```
3. Deploy using Heroku CLI or GitHub integration

### Other Platforms

The app can be deployed to any Node.js hosting platform:
- Vercel
- Netlify
- Railway
- DigitalOcean App Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Showdown.js](https://github.com/showdownjs/showdown) for markdown parsing
- [Socket.IO](https://socket.io/) for real-time communication
- [Font Awesome](https://fontawesome.com/) for icons
- [Inter Font](https://rsms.me/inter/) for typography

## 📞 Support

If you have any questions or need help, please:

1. Check the [Issues](https://github.com/yourusername/MarkThatDown/issues) page
2. Create a new issue if your problem isn't already listed
3. Join our [Discord](https://discord.gg/markthatdown) community

---

Made with ❤️ by [Your Name] 