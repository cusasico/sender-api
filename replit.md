# Gifted WhatsApp API

## Overview
WhatsApp API server using gifted-baileys and Express. Provides an API for sending WhatsApp messages with various types including text, media, and verification codes with buttons.

## Project Structure
- `index.js` - Main Express server and WhatsApp connection logic
- `config.js` - Configuration with environment variables
- `gift/` - Helper modules for session management and message handling
- `public/` - Static frontend files
- `.env` - Environment variables (SESSION_ID for WhatsApp auth)

## Setup
- Node.js 20
- Port: 5000
- Run: `npm start` or `node index.js`

## API Endpoints
- `POST /api/sendMessage.php` - Send WhatsApp messages
- `GET /health` - Health check endpoint
- `GET /` - Static frontend

## Configuration
Environment variables in `.env` or `config.env`:
- SESSION_ID - WhatsApp session credentials
- AUTO_READ_STATUS - Auto read WhatsApp statuses
- AUTO_LIKE_STATUS - Auto like statuses
- MODE - Bot mode (private/public/inbox/groups)
- API_URL - API base URL
