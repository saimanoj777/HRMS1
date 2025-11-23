const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hrms.db'); // Persistent database

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    org_id INTEGER,
    FOREIGN KEY (org_id) REFERENCES organizations (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    org_id INTEGER,
    FOREIGN KEY (org_id) REFERENCES organizations (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    org_id INTEGER,
    FOREIGN KEY (org_id) REFERENCES organizations (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS employee_teams (
    employee_id INTEGER,
    team_id INTEGER,
    PRIMARY KEY (employee_id, team_id),
    FOREIGN KEY (employee_id) REFERENCES employees (id),
    FOREIGN KEY (team_id) REFERENCES teams (id)
  )`);

  // Create logs table
  db.run(`CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
});

function logAction(userId, action, details = '') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] User '${userId}' ${action}${details ? ': ' + details : '.'}`);
  
  // Save log to database
  db.run(
    'INSERT INTO logs (user_id, action, details) VALUES (?, ?, ?)',
    [userId, action, details],
    (err) => {
      if (err) {
        console.error('Failed to log action to database:', err);
      }
    }
  );
}

module.exports = { db, logAction };