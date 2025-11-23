require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('./middleware/auth');
const { db, logAction, seedDatabase } = require('./db');
const path = require('path');

const app = express();
const SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Middleware order is important!
// Body parser first
app.use(bodyParser.json());

// CORS next
app.use(cors());

// Seed the database when the server starts
seedDatabase().catch(err => {
  console.error('Error seeding database:', err);
});

// API routes
// Add this new endpoint for fetching activity logs
app.get('/api/logs', auth, (req, res) => {
  const orgId = req.user.orgId;
  
  // Fetch logs for the organization with user details
  const query = `
    SELECT l.id, l.action, l.details, l.timestamp, u.username as user
    FROM logs l
    JOIN users u ON l.user_id = u.id
    WHERE u.org_id = ?
    ORDER BY l.timestamp DESC
    LIMIT 100
  `;
  
  db.all(query, [orgId], (err, rows) => {
    if (err) {
      console.error('Error fetching logs:', err);
      return res.status(500).json({ error: 'Failed to fetch logs' });
    }
    
    res.json(rows);
  });
});

app.post('/api/auth/register', (req, res) => {
  console.log('API Registration request received:', req.body);
  const { username, password, orgName } = req.body;
  if (!username || !password || !orgName) {
    console.log('Missing fields:', { username, password, orgName });
    return res.status(400).json({ error: 'Missing fields' });
  }

  // Check if username already exists
  db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.log('Error checking username:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (user) {
      console.log('Username already exists:', username);
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create org
    db.run('INSERT INTO organizations (name) VALUES (?)', [orgName], function(err) {
      if (err) {
        console.log('Error creating organization:', err);
        return res.status(500).json({ error: err.message });
      }
      const orgId = this.lastID;
      console.log('Organization created with ID:', orgId);

      // Hash password
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          console.log('Error hashing password:', err);
          return res.status(500).json({ error: err.message });
        }

        // Create user
        db.run('INSERT INTO users (username, password, org_id) VALUES (?, ?, ?)', [username, hash, orgId], function(err) {
          if (err) {
            console.log('Error creating user:', err);
            return res.status(500).json({ error: err.message });
          }
          const userId = this.lastID;
          console.log('User created with ID:', userId);

          // Log
          logAction(userId, 'registered and created organization', orgName);

          // Generate token
          const token = jwt.sign({ userId, orgId }, SECRET);
          console.log('Token generated for user:', userId);
          res.json({ token, user: { id: userId, username, orgId } });
        });
      });
    });
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('API Login request received:', req.body);
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

  db.get('SELECT id, password, org_id FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });

    bcrypt.compare(password, user.password, (err, match) => {
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });

      logAction(user.id, 'logged in');

      const token = jwt.sign({ userId: user.id, orgId: user.org_id }, SECRET);
      res.json({ token, user: { id: user.id, username, orgId: user.org_id } });
    });
  });
});

app.post('/api/auth/logout', auth, (req, res) => {
  console.log('API Logout request received');
  logAction(req.user.userId, 'logged out');
  res.json({ message: 'Logged out' });
});

// Employee Routes (protected)
app.get('/api/employees', auth, (req, res) => {
  const orgId = req.user.orgId;
  db.all(`SELECT * FROM employees WHERE org_id = ?`, [orgId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/employees/:id', auth, (req, res) => {
  const { id } = req.params;
  const orgId = req.user.orgId;
  
  db.get(`SELECT * FROM employees WHERE id = ? AND org_id = ?`, [id, orgId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Employee not found' });
    res.json(row);
  });
});

app.post('/api/employees', auth, (req, res) => {
  const { name, email } = req.body;
  const orgId = req.user.orgId;
  if (!name || !email) return res.status(400).json({ error: 'Missing fields' });

  db.run('INSERT INTO employees (name, email, org_id) VALUES (?, ?, ?)', [name, email, orgId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    logAction(req.user.userId, 'added a new employee', `with ID ${this.lastID}`);
    res.json({ id: this.lastID });
  });
});

app.put('/api/employees/:id', auth, (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  const orgId = req.user.orgId;
  if (!name || !email) return res.status(400).json({ error: 'Missing fields' });

  db.run('UPDATE employees SET name = ?, email = ? WHERE id = ? AND org_id = ?', [name, email, id, orgId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    logAction(req.user.userId, `updated employee ${id}`);
    res.json({ message: 'Updated' });
  });
});

app.delete('/api/employees/:id', auth, (req, res) => {
  const { id } = req.params;
  const orgId = req.user.orgId;

  // First remove assignments
  db.run('DELETE FROM employee_teams WHERE employee_id = ?', [id]);
  // Then delete employee
  db.run('DELETE FROM employees WHERE id = ? AND org_id = ?', [id, orgId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    logAction(req.user.userId, `deleted employee ${id}`);
    res.json({ message: 'Deleted' });
  });
});

// Team Routes (protected)
app.get('/api/teams', auth, (req, res) => {
  const orgId = req.user.orgId;
  db.all(`SELECT * FROM teams WHERE org_id = ?`, [orgId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/teams/:id', auth, (req, res) => {
  const { id } = req.params;
  const orgId = req.user.orgId;
  
  db.get(`SELECT * FROM teams WHERE id = ? AND org_id = ?`, [id, orgId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Team not found' });
    res.json(row);
  });
});

app.post('/api/teams', auth, (req, res) => {
  const { name } = req.body;
  const orgId = req.user.orgId;
  if (!name) return res.status(400).json({ error: 'Missing fields' });

  db.run('INSERT INTO teams (name, org_id) VALUES (?, ?)', [name, orgId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    logAction(req.user.userId, 'added a new team', `with ID ${this.lastID}`);
    res.json({ id: this.lastID });
  });
});

app.put('/api/teams/:id', auth, (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const orgId = req.user.orgId;
  if (!name) return res.status(400).json({ error: 'Missing fields' });

  db.run('UPDATE teams SET name = ? WHERE id = ? AND org_id = ?', [name, id, orgId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    logAction(req.user.userId, `updated team ${id}`);
    res.json({ message: 'Updated' });
  });
});

app.delete('/api/teams/:id', auth, (req, res) => {
  const { id } = req.params;
  const orgId = req.user.orgId;

  // First remove assignments
  db.run('DELETE FROM employee_teams WHERE team_id = ?', [id]);
  // Then delete team
  db.run('DELETE FROM teams WHERE id = ? AND org_id = ?', [id, orgId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    logAction(req.user.userId, `deleted team ${id}`);
    res.json({ message: 'Deleted' });
  });
});

// Assignment Routes
app.get('/api/assignments', auth, (req, res) => {
  const orgId = req.user.orgId;
  db.all(`
    SELECT e.id as emp_id, e.name as emp_name, e.email, t.id as team_id, t.name as team_name
    FROM employee_teams et
    JOIN employees e ON et.employee_id = e.id
    JOIN teams t ON et.team_id = t.id
    WHERE e.org_id = ?
  `, [orgId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/assignments', auth, (req, res) => {
  const { employeeId, teamId } = req.body;
  const orgId = req.user.orgId;

  // Verify existence (simple check)
  db.get('SELECT id FROM employees WHERE id = ? AND org_id = ?', [employeeId, orgId], (err, emp) => {
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    db.get('SELECT id FROM teams WHERE id = ? AND org_id = ?', [teamId, orgId], (err, team) => {
      if (!team) return res.status(404).json({ error: 'Team not found' });

      db.run('INSERT OR IGNORE INTO employee_teams (employee_id, team_id) VALUES (?, ?)', [employeeId, teamId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes > 0) {
          logAction(req.user.userId, `assigned employee ${employeeId} to team ${teamId}`);
        }
        res.json({ message: 'Assigned' });
      });
    });
  });
});

app.delete('/api/assignments', auth, (req, res) => {
  const { employeeId, teamId } = req.body;
  const orgId = req.user.orgId;

  db.run('DELETE FROM employee_teams WHERE employee_id = ? AND team_id = ?', [employeeId, teamId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Assignment not found' });
    logAction(req.user.userId, `removed employee ${employeeId} from team ${teamId}`);
    res.json({ message: 'Removed' });
  });
});

// Serve frontend for any other routes (this should be last)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
// });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));