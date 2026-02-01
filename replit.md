# Gifted WhatsApp API

## Overview
WhatsApp API server using gifted-baileys and Express. Provides an API for sending WhatsApp messages with various types including text, media, and verification codes with interactive buttons.

## Project Structure
- `index.js` - Main Express server and WhatsApp connection logic with stability improvements
- `config.js` - Configuration with environment variables
- `gift/` - Helper modules for session management and message handling
- `public/index.html` - API documentation and interactive playground
- `.env` - Environment variables (SESSION_ID for WhatsApp auth)

## Setup
- Node.js 20
- Port: 5000
- Run: `npm start` or `node index.js`

## API Endpoints
- `POST /api/sendMessage.php` - Send WhatsApp messages
- `GET /api/status` - Connection status endpoint
- `GET /health` - Health check endpoint
- `GET /` - API documentation and playground

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

## Recent Changes
- 2026-02-01: Fixed connection stability issues with better state management
- 2026-02-01: Added verification code playground to frontend
- 2026-02-01: Added /api/status endpoint for connection monitoring
