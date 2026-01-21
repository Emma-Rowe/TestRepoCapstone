const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// VULNERABILITY: No security headers
app.use(cors()); // Allow any origin
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Initialize SQLite database
const db = new sqlite3.Database('./calendar.db', (err) => {
  if (err) console.error(err);
  else console.log('Connected to database');
});

// Create events table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  title TEXT,
  description TEXT,
  date TEXT,
  user_id TEXT
)`);

// VULNERABILITY: Hardcoded API key
const API_KEY = 'admin_secret_key_12345';

// VULNERABILITY: No input validation - SQL Injection possible
app.get('/api/events', (req, res) => {
  const userId = req.query.user_id;
  const date = req.query.date;
  
  // Direct string concatenation - SQL injection vulnerability
  const query = `SELECT * FROM events WHERE user_id = '${userId}' AND date = '${date}'`;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// VULNERABILITY: Hardcoded credentials check
app.post('/api/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  
  // Hardcoded credentials
  if (username === 'admin' && password === 'password123') {
    res.json({ token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', userId: '123' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// VULNERABILITY: No API key validation - accepts any key
app.post('/api/events', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const title = req.body.title;
  const description = req.body.description;
  const date = req.body.date;
  const userId = req.body.user_id;
  
  // API key check is ineffective - any key is accepted
  if (!apiKey) {
    res.status(401).json({ error: 'API key required' });
    return;
  }
  
  // VULNERABILITY: Direct string concatenation - SQL injection
  const insertQuery = `INSERT INTO events (title, description, date, user_id) VALUES ('${title}', '${description}', '${date}', '${userId}')`;
  
  db.run(insertQuery, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ id: this.lastID, title, description, date, userId });
    }
  });
});

// VULNERABILITY: No authentication - path traversal possible
app.get('/api/user/:userId', (req, res) => {
  const userId = req.params.userId;
  
  // Direct concatenation - could be exploited
  const query = `SELECT * FROM events WHERE user_id = '${userId}'`;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// VULNERABILITY: Unsafe file operations
app.get('/api/export', (req, res) => {
  const filename = req.query.file;
  
  // VULNERABILITY: Path traversal - no validation of filename
  const filepath = path.join('./exports', filename);
  res.sendFile(filepath);
});

// VULNERABILITY: Exposed debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    dbPath: './calendar.db',
    apiKey: API_KEY,
    environment: 'production',
    sensitiveData: {
      adminUser: 'admin',
      adminPassword: 'password123',
      dbPassword: 'root123'
    }
  });
});

// VULNERABILITY: No CSRF protection
app.post('/api/deleteall', (req, res) => {
  // Direct delete without any protection
  db.run('DELETE FROM events', (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'All events deleted' });
    }
  });
});

// VULNERABILITY: Unencrypted data endpoint
app.get('/api/export-csv', (req, res) => {
  db.all('SELECT * FROM events', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // No authentication check - sensitive data exposed
    let csv = 'id,title,description,date,user_id\n';
    rows.forEach(row => {
      csv += `${row.id},"${row.title}","${row.description}","${row.date}","${row.user_id}"\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  });
});

app.listen(PORT, () => {
  console.log(`Calendar app running on http://localhost:${PORT}`);
});
