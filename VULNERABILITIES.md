# Vulnerable Calendar App

A simple calendar application intentionally built with security vulnerabilities for testing security scanning tools.

## Vulnerabilities Included

This app contains the following common security issues that a vulnerability scanner like Vibesec can detect:

### 1. **SQL Injection**
   - `/api/events` endpoint uses string concatenation for SQL queries
   - User input directly concatenated without prepared statements
   - Affects: `userId`, `date` query parameters

### 2. **Cross-Site Scripting (XSS)**
   - Event titles and descriptions rendered directly into HTML
   - No input sanitization or escaping
   - File: `public/app.js` - `displayEvents()` function

### 3. **Hardcoded Credentials**
   - Admin username: `admin`
   - Admin password: `password123`
   - API key: `admin_secret_key_12345` (hardcoded in both client and server)
   - Database credentials exposed in debug endpoint

### 4. **No Input Validation**
   - Event creation accepts any input
   - No length limits, type checking, or format validation

### 5. **Missing Security Headers**
   - No CSRF protection
   - No Content Security Policy (CSP)
   - No X-Frame-Options
   - No secure cookie flags

### 6. **Weak API Key Validation**
   - API key check exists but doesn't actually validate the key
   - Any key is accepted

### 7. **Exposed Debug Endpoint**
   - `/api/debug` endpoint reveals sensitive information
   - Exposes database paths, credentials, and API keys

### 8. **Path Traversal**
   - `/api/export` endpoint doesn't validate file paths
   - Potential to access files outside intended directory

### 9. **Unencrypted Data Handling**
   - Credentials sent over HTTP (not HTTPS)
   - Tokens stored in localStorage instead of httpOnly cookies
   - CSV export has no authentication

### 10. **CSRF Vulnerability**
   - `/api/deleteall` endpoint accepts POST requests without CSRF tokens
   - No origin validation

### 11. **No Authentication on Sensitive Endpoints**
   - Export endpoints accessible without proper auth
   - User data can be retrieved by changing user_id parameter

### 12. **Direct File Operations**
   - No permission checks on file access
   - No validation of file types or locations

## Setup and Usage

```bash
# Install dependencies
npm install

# Start the app
npm start
```

The app will run on `http://localhost:3000`

### Test Credentials
- Username: `admin`
- Password: `password123`

### API Endpoints

- `POST /api/login` - User login (vulnerable)
- `GET /api/events` - Get events (SQL injection)
- `POST /api/events` - Create event (SQL injection, XSS)
- `GET /api/user/:userId` - Get user events (SQL injection)
- `GET /api/export` - Export file (path traversal)
- `GET /api/debug` - Debug info (information disclosure)
- `POST /api/deleteall` - Delete all events (CSRF)
- `GET /api/export-csv` - Export CSV (no auth)

## Purpose

This application is designed for security testing and educational purposes. Use it to:
- Test your security scanning tool (Vibesec)
- Learn about common web vulnerabilities
- Practice vulnerability detection and remediation
- Understand OWASP Top 10 issues

⚠️ **Warning**: Do not use this code in production or expose it to the internet!
