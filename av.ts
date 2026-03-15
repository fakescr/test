import express, { Request, Response } from 'express';
import { exec } from 'child_process';
import mysql from 'mysql2';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password123',
  database: 'testdb'
});

// ================================================================
// 1. SQL INJECTION VULNERABILITY
// ================================================================
app.get('/user', (req: Request, res: Response) => {
  const username = req.query.username as string;
  
  // ❌ VULNERABLE: Direct string concatenation in SQL query
  const query = `SELECT * FROM users WHERE username = '${username}'`;
  
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// ================================================================
// 2. XSS VULNERABILITY
// ================================================================
app.get('/search', (req: Request, res: Response) => {
  const searchTerm = req.query.q as string;
  
  // ❌ VULNERABLE: User input directly in HTML without sanitization
  const html = `
    <html>
      <body>
        <h1>Search Results for: ${searchTerm}</h1>
        <div id="results">
          You searched for: ${searchTerm}
        </div>
      </body>
    </html>
  `;
  
  res.send(html);
});

// ================================================================
// 3. RCE (Remote Code Execution) VULNERABILITY
// ================================================================
app.post('/run', (req: Request, res: Response) => {
  const command = req.body.cmd as string;
  
  // ❌ VULNERABLE: Direct user input in exec command
  exec(command, (error, stdout, stderr) => {
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ output: stdout });
  });
});

// ================================================================
// 4. BONUS: PATH TRAVERSAL VULNERABILITY
// ================================================================
app.get('/file', (req: Request, res: Response) => {
  const filename = req.query.name as string;
  
  // ❌ VULNERABLE: No path sanitization
  const fs = require('fs');
  const filePath = '/var/www/uploads/' + filename;
  
  fs.readFile(filePath, 'utf8', (err: any, data: string) => {
    if (err) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    res.send(data);
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
