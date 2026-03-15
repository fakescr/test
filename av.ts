import express, { Request, Response } from 'express';
import { exec } from 'child_process';
import mysql from 'mysql2';
import jwt from 'jsonwebtoken';
import xml2js from 'xml2js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================================================================
// 1. HARDCODED SECRETS 🔴 Critical
// ================================================================
const DB_PASSWORD = "admin123";
const JWT_SECRET = "mysecretkey123";
const API_KEY = "sk-1234567890abcdef";
const AWS_SECRET = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: DB_PASSWORD,
  database: 'testdb'
});

// ================================================================
// 2. SQL INJECTION 🔴
// ================================================================
app.get('/user', (req: Request, res: Response) => {
  const username = req.query.username as string;
  // ❌ VULNERABLE
  const query = `SELECT * FROM users WHERE username = '${username}'`;
  db.query(query, (err, results) => {
    res.json(results);
  });
});

// ================================================================
// 3. XSS 🔴
// ================================================================
app.get('/search', (req: Request, res: Response) => {
  const searchTerm = req.query.q as string;
  // ❌ VULNERABLE
  res.send(`<h1>Results for: ${searchTerm}</h1>`);
});

// ================================================================
// 4. RCE 🔴
// ================================================================
app.post('/run', (req: Request, res: Response) => {
  const command = req.body.cmd as string;
  // ❌ VULNERABLE
  exec(command, (error, stdout) => {
    res.json({ output: stdout });
  });
});

// ================================================================
// 5. SSRF 🔴 Critical
// ================================================================
app.get('/fetch', async (req: Request, res: Response) => {
  const url = req.query.url as string;
  // ❌ VULNERABLE: Koi bhi internal URL fetch kar sakta hai
  const response = await fetch(url);
  const data = await response.text();
  res.send(data);
});

// ================================================================
// 6. BROKEN AUTHENTICATION 🔴
// ================================================================
app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  // ❌ VULNERABLE: Weak secret + no expiry
  const token = jwt.sign(
    { username, role: 'admin' },
    JWT_SECRET,  // weak secret
    // no expiresIn!
  );
  // ❌ Insecure cookie
  res.cookie('token', token, {
    httpOnly: false,  // ❌
    secure: false,    // ❌
    sameSite: false   // ❌
  });
  res.json({ token });
});

// ================================================================
// 7. IDOR 🟠
// ================================================================
app.get('/account/:id', (req: Request, res: Response) => {
  const userId = req.params.id;
  // ❌ VULNERABLE: Koi bhi kisi ka bhi account dekh sakta hai
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  db.query(query, (err, results) => {
    res.json(results);
  });
});

// ================================================================
// 8. XXE INJECTION 🔴
// ================================================================
app.post('/xml', (req: Request, res: Response) => {
  const xmlData = req.body.xml as string;
  // ❌ VULNERABLE: External entities allowed
  xml2js.parseString(xmlData, {
    explicitCharkey: true
  }, (err, result) => {
    res.json(result);
  });
});

// ================================================================
// 9. OPEN REDIRECT 🟠
// ================================================================
app.get('/redirect', (req: Request, res: Response) => {
  const redirectUrl = req.query.url as string;
  // ❌ VULNERABLE: Kisi bhi URL pe redirect
  res.redirect(redirectUrl);
});

// ================================================================
// 10. PROTOTYPE POLLUTION 🟠
// ================================================================
app.post('/merge', (req: Request, res: Response) => {
  const userInput = req.body;
  const config = {};
  // ❌ VULNERABLE
  function merge(target: any, source: any) {
    for (let key in source) {
      target[key] = source[key]; // __proto__ pollution possible
    }
  }
  merge(config, userInput);
  res.json(config);
});

// ================================================================
// 11. CORS MISCONFIGURATION 🟡
// ================================================================
app.use((req, res, next) => {
  // ❌ VULNERABLE: Sabko allow kar raha hai
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', '*');
  next();
});

// ================================================================
// 12. REGEX DoS (ReDoS) 🟡
// ================================================================
app.post('/validate', (req: Request, res: Response) => {
  const email = req.body.email as string;
  // ❌ VULNERABLE: Evil regex
  const emailRegex = /^([a-zA-Z0-9])(([a-zA-Z0-9])*([\._-])?([a-zA-Z0-9]))*@([a-zA-Z0-9])+\.([a-zA-Z0-9])+$/;
  const isValid = emailRegex.test(email);
  res.json({ valid: isValid });
});

// ================================================================
// 13. PATH TRAVERSAL 🟠
// ================================================================
app.get('/file', (req: Request, res: Response) => {
  const filename = req.query.name as string;
  const fs = require('fs');
  // ❌ VULNERABLE
  fs.readFile('/var/www/' + filename, 'utf8', (err: any, data: string) => {
    res.send(data);
  });
});

// ================================================================
// 14. NoSQL INJECTION 🟠
// ================================================================
app.post('/nosql', (req: Request, res: Response) => {
  const { username, password } = req.body;
  // ❌ VULNERABLE: MongoDB query injection
  const query = {
    username: username,
    password: password  // attacker can pass {$gt: ""} to bypass
  };
  res.json({ query }); // simulated
});

app.listen(3000, () => {
  console.log('Vulnerable server running!');
});
```

---

