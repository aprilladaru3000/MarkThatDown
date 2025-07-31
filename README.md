# MarkThatDown - Real-time Markdown Viewer

A real-time collaborative Markdown editor that allows multiple users to edit the same document simultaneously. Built with Node.js, Express, Socket.IO, and Redis.

## Features

- **Real-time Collaboration**: Multiple users can edit the same Markdown document simultaneously
- **Live Preview**: See your Markdown converted to HTML in real-time
- **Shareable URLs**: Each document has a unique URL that can be shared with others
- **Tab Support**: Proper tab key handling in the text editor
- **Responsive Design**: Bootstrap-based responsive layout

## Prerequisites

- Node.js (version 14 or higher)
- Redis server (optional for local development, required for production)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MarkThatDown
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
node server.js
```

4. Open your browser and navigate to `http://localhost:8000`

## Usage

- **Home Page**: Visit `http://localhost:8000` to see the welcome page
- **Create/Edit Documents**: Visit `http://localhost:8000/document-name` to create or edit a document
- **Collaborate**: Share the URL with others to collaborate in real-time

## Project Structure

```
MarkThatDown/
├── server.js          # Main server file
├── package.json       # Dependencies and project configuration
├── Procfile          # Heroku deployment configuration
├── views/
│   └── pad.ejs      # Main HTML template
├── public/
│   ├── style.css    # CSS styles
│   └── script.js    # Frontend JavaScript
└── README.md        # This file
```

## Technologies Used

- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.IO
- **Database**: Redis (for production)
- **Template Engine**: EJS
- **Frontend**: HTML5, CSS3, JavaScript
- **Markdown Parser**: Showdown.js
- **UI Framework**: Bootstrap

## Deployment

### Local Development
```bash
node server.js
```

### Heroku Deployment
1. Create a Heroku account and install Heroku CLI
2. Login to Heroku: `heroku login`
3. Create a new Heroku app: `heroku create`
4. Add Redis addon: `heroku addons:create redistogo`
5. Deploy: `git push heroku master`
6. Open the app: `heroku open`

## Features in Detail

### Real-time Collaboration
- Uses Socket.IO for real-time document synchronization
- Changes are automatically broadcast to all connected users
- Multiple users can edit simultaneously without conflicts

### Markdown Preview
- Converts Markdown to HTML in real-time
- Uses Showdown.js for Markdown parsing
- Updates preview every second when changes are detected

### Tab Key Support
- Custom implementation to handle tab key in textarea
- Prevents focus loss when pressing tab
- Inserts tab character at cursor position

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE). 