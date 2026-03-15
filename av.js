const express = require('express');
const { exec } = require('child_process');
const mysql = require('mysql2');
// vuln.js mein add karo
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(':memory:');

app.get('/login', (req, res) => {
  const user = req.query.user;
  db.all("SELECT * FROM users WHERE name = '" + user + "'", (err, rows) => {
    res.json(rows);
  });
});
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. SQL INJECTION
app.get('/user', (req, res) => {
  const username = req.query.username;
  const query = "SELECT * FROM users WHERE username = '" + username + "'";
  res.send(query);
});

// 2. XSS
app.get('/search', (req, res) => {
  const search = req.query.q;
  res.send('<h1>' + search + '</h1>');
});

// 3. RCE
app.post('/run', (req, res) => {
  const cmd = req.body.cmd;
  exec(cmd, (err, stdout) => {
    res.send(stdout);
  });
});

// 4. PATH TRAVERSAL
app.get('/file', (req, res) => {
  const fs = require('fs');
  const file = '/var/www/' + req.query.name;
  fs.readFile(file, 'utf8', (err, data) => {
    res.send(data);
  });
});

// 5. OPEN REDIRECT
app.get('/redirect', (req, res) => {
  res.redirect(req.query.url);
});

// 6. HARDCODED SECRET
const SECRET = "admin123";
const API_KEY = "sk-1234567890abcdef";

// vuln.js mein yeh add karo

// GitHub Token - real format
const GITHUB_TOKEN = "ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789";

// AWS - real format  
const AWS_KEY = "AKIAIOSFODNN7ABCDEFG";
const AWS_SECRET = "abcdefghijklmnopqrstuvwxyz1234567890ABCD";

// Stripe - real format
const STRIPE_SECRET = "sk_live_abcdefghijklmnopqrstuvwx";

// Twilio
const TWILIO_TOKEN = "SKabcdefghijklmnopqrstuvwxyz123456";

// SendGrid
const SENDGRID_KEY = "SG.abcdefghijklmnop.qrstuvwxyzABCDEFGHIJKLMNOP";

app.listen(3000);
