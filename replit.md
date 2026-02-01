# Gifted API - WhatsApp API

## Overview
This is a WhatsApp API server using gifted-baileys and Express.js. It provides endpoints for sending WhatsApp messages programmatically.

## Project Structure
```
├── index.js          # Main server entry point (Express app)
├── config.js         # Configuration (env vars, settings)
├── package.json      # Node.js dependencies
├── gift/             # Core modules
│   ├── api.js        # API helpers
│   ├── connection.js # Connection manager
│   ├── logger.js     # Logging utilities
│   ├── media.js      # Media handling
│   ├── messages.js   # Message handling
│   ├── session.js    # Session management
│   └── store.js      # Message store
└── public/           # Static frontend files
    └── index.html    # API documentation page
```

## Running the Project
- Start command: `npm start`
- Port: 5000
- The server binds to 0.0.0.0:5000 for Replit compatibility

## API Endpoints
- `GET /` - Serves the documentation page
- `GET /health` - Health check endpoint
- `GET /api/status` - Connection status
- `POST /api/sendMessage.php` - Send WhatsApp messages

## Configuration
Environment variables (can be set in config.js or as secrets):
- `SESSION_ID` - WhatsApp session ID
- `AUTO_READ_STATUS` - Auto-read status updates
- `AUTO_LIKE_STATUS` - Auto-like status updates
- `MODE` - Operation mode (private/public/inbox/groups)
- `API_URL` - API URL for external references

## Recent Changes
- Feb 2026: Fixed mobile touch handling across all pages (index.html, playground, examples)
  - Replaced onclick handlers with proper touch event handling
  - Added minimum 44px touch target sizes for buttons and interactive elements
  - Enabled horizontal scrolling for code blocks on mobile
  - Fixed theme toggle, menu button, and sidebar functionality on mobile
- Feb 2026: Initial Replit setup, configured to bind to 0.0.0.0:5000
