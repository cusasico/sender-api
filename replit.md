# Gifted WhatsApp API

## Overview
WhatsApp API server using gifted-baileys and Express. Provides an API for sending WhatsApp messages with various types including text, media, and verification codes with interactive buttons.

## Project Structure
- `index.js` - Main Express server with clean, modular architecture
- `config.js` - Configuration with environment variables
- `gift/` - Core modules directory:
  - `index.js` - Main exports, re-exports all modules
  - `connection.js` - ConnectionManager class for connection lifecycle
  - `session.js` - Session loading and validation
  - `store.js` - CustomStore class for message/chat storage
  - `messages.js` - Message templates and incoming message handling
  - `media.js` - Media detection and sending logic
  - `api.js` - API request validation and processing
  - `logger.js` - Logging utilities
- `public/` - Frontend files:
  - `index.html` - API documentation page
  - `playground.html` - Interactive API playground
  - `examples.html` - Code examples (cURL, JavaScript, Python)
- `.env` - Environment variables (SESSION_ID for WhatsApp auth)

## Setup
- Node.js 20
- Port: 5000
- Run: `npm start` or `node index.js`

## API Endpoints
- `POST /api/sendMessage.php` - Send WhatsApp messages
- `GET /api/status` - Connection status endpoint
- `GET /health` - Health check endpoint
- `GET /` - API documentation page
- `GET /playground.html` - Interactive API testing playground
- `GET /examples.html` - Code examples page

## Message Types
- `text` - Simple text message with channel button
- `media` - Send images, videos, audio, documents
- `sendSignupCode` - Signup verification code with copy button
- `sendResetCode` - Password reset code with security warning
- `sendResendCode` - Resend verification code
- `sendDeleteCode` - Account deletion code with warning

## Connection Stability Features
- Exponential backoff reconnection (3s to 60s)
- Connection state management with ready checks
- Message retry logic with connection verification
- Connection lock to prevent duplicate connections
- 2-second stabilization delay after connection

## Configuration
Environment variables in `.env`:
- SESSION_ID - WhatsApp session credentials
- AUTO_READ_STATUS - Auto read WhatsApp statuses
- AUTO_LIKE_STATUS - Auto like statuses
- MODE - Bot mode (private/public/inbox/groups)
- API_URL - API base URL

## Frontend Features
- Header with rounded logo and WASENDER API gradient branding
- Mobile responsive sidebar navigation
- Particles.js animated background
- Dark theme by default (light theme available)
- Animated heartbeat footer with Gifted Tech link
- Real-time connection status indicator
- Code examples page with cURL, JavaScript, Python
- API domain: https://whatsapp.giftedtech.co.ke

## Media Message Handling
- Auto-detects MIME type from HTTP headers, URL extension, or filename
- Only requires: mediaUrl (required), name (optional for documents), caption (optional)
- Supports images, videos, audio, documents (PDF, DOCX, etc.)

## Architecture
- **ConnectionManager**: Handles connection lifecycle, reconnection logic, timeouts
- **CustomStore**: In-memory message/chat storage with automatic cleanup
- **Message Templates**: Centralized templates for verification code messages
- **Media Handler**: Auto-detects MIME types from headers, URL, or filename
- **API Layer**: Request validation, retry logic, response formatting

## Recent Changes
- 2026-02-01: Major refactor - modular architecture with separate gift/ modules
- 2026-02-01: Added theme dropdown with Light/Dark/System options
- 2026-02-01: Added examples page with code snippets for cURL, JavaScript, Python
- 2026-02-01: Made dark theme the default for new users
- 2026-02-01: Improved media handling with auto MIME type detection
- 2026-02-01: Complete frontend redesign with separate documentation and playground pages
- 2026-02-01: Added header with logo, mobile sidebar, particles.js background
- 2026-02-01: Fixed connection stability issues with better state management
- 2026-02-01: Added /api/status endpoint for connection monitoring
