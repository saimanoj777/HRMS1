const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

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

// Seed the database with default data
function seedDatabase() {
  return new Promise((resolve, reject) => {
    // Check if admin user already exists
    db.get("SELECT id FROM users WHERE username = 'admin'", (err, row) => {
      if (err) {
        console.error('Error checking for existing admin user:', err);
        return reject(err);
      }
      
      if (row) {
        console.log('Admin user already exists, skipping seed.');
        seedSampleData().then(resolve).catch(reject);
        return;
      }
      
      // Create organization
      db.run("INSERT OR IGNORE INTO organizations (name) VALUES ('Default Organization')", function(err) {
        if (err) {
          console.error('Error creating organization:', err);
          return reject(err);
        }
        
        const orgId = this.lastID || 1;
        console.log('Organization created with ID:', orgId);
        
        // Hash password
        bcrypt.hash('123456', 10, (err, hashedPassword) => {
          if (err) {
            console.error('Error hashing password:', err);
            return reject(err);
          }
          
          // Create admin user
          db.run(
            'INSERT INTO users (username, password, org_id) VALUES (?, ?, ?)',
            ['admin', hashedPassword, orgId],
            function(err) {
              if (err) {
                console.error('Error creating admin user:', err);
                return reject(err);
              }
              
              console.log('Admin user created with ID:', this.lastID);
              console.log('Authentication details - Username: admin, Password: 123456');
              
              // Seed sample data
              seedSampleData().then(resolve).catch(reject);
            }
          );
        });
      });
    });
  });
}

// Seed sample data (employees and teams)
function seedSampleData() {
  return new Promise((resolve, reject) => {
    // Get organization ID
    db.get("SELECT id FROM organizations LIMIT 1", (err, org) => {
      if (err) {
        console.error('Error getting organization:', err);
        return reject(err);
      }
      
      if (!org) {
        console.log('No organization found, skipping sample data seeding.');
        return resolve();
      }
      
      const orgId = org.id;
      
      // Check if we already have sample data
      db.get("SELECT COUNT(*) as count FROM employees", (err, result) => {
        if (err) {
          console.error('Error checking existing employees:', err);
          return reject(err);
        }
        
        if (result.count > 0) {
          console.log('Sample data already exists, skipping sample data seeding.');
          return resolve();
        }
        
        // Insert sample employees
        const employees = [
          { name: 'John Doe', email: 'john.doe@example.com' },
          { name: 'Jane Smith', email: 'jane.smith@example.com' },
          { name: 'Robert Johnson', email: 'robert.johnson@example.com' },
          { name: 'Emily Davis', email: 'emily.davis@example.com' }
        ];
        
        let employeeCount = 0;
        employees.forEach(emp => {
          db.run(
            'INSERT INTO employees (name, email, org_id) VALUES (?, ?, ?)',
            [emp.name, emp.email, orgId],
            function(err) {
              if (err) {
                console.error('Error inserting employee:', err);
              } else {
                employeeCount++;
                console.log(`Inserted employee: ${emp.name}`);
              }
              
              // After inserting all employees, insert sample teams
              if (employeeCount === employees.length) {
                insertSampleTeams(orgId, resolve, reject);
              }
            }
          );
        });
      });
    });
  });
}

// Insert sample teams
function insertSampleTeams(orgId, resolve, reject) {
  const teams = [
    { name: 'Engineering' },
    { name: 'Marketing' },
    { name: 'Sales' },
    { name: 'Human Resources' }
  ];
  
  let teamCount = 0;
  teams.forEach(team => {
    db.run(
      'INSERT INTO teams (name, org_id) VALUES (?, ?)',
      [team.name, orgId],
      function(err) {
        if (err) {
          console.error('Error inserting team:', err);
        } else {
          teamCount++;
          console.log(`Inserted team: ${team.name}`);
        }
        
        // After inserting all teams, insert sample assignments
        if (teamCount === teams.length) {
          insertSampleAssignments(resolve, reject);
        }
      }
    );
  });
}

// Insert sample employee-team assignments
function insertSampleAssignments(resolve, reject) {
  // Simple assignments - first employee to first team, etc.
  const assignments = [
    { employeeIndex: 1, teamIndex: 1 }, // John Doe -> Engineering
    { employeeIndex: 2, teamIndex: 2 }, // Jane Smith -> Marketing
    { employeeIndex: 3, teamIndex: 3 }, // Robert Johnson -> Sales
    { employeeIndex: 4, teamIndex: 4 }  // Emily Davis -> Human Resources
  ];
  
  // Get all employees and teams to map indices to IDs
  db.all("SELECT id FROM employees ORDER BY id", (err, employees) => {
    if (err) {
      console.error('Error getting employees:', err);
      return reject(err);
    }
    
    db.all("SELECT id FROM teams ORDER BY id", (err, teams) => {
      if (err) {
        console.error('Error getting teams:', err);
        return reject(err);
      }
      
      let assignmentCount = 0;
      assignments.forEach(assignment => {
        // Make sure indices are valid
        if (employees[assignment.employeeIndex - 1] && teams[assignment.teamIndex - 1]) {
          const empId = employees[assignment.employeeIndex - 1].id;
          const teamId = teams[assignment.teamIndex - 1].id;
          
          db.run(
            'INSERT INTO employee_teams (employee_id, team_id) VALUES (?, ?)',
            [empId, teamId],
            function(err) {
              if (err) {
                console.error('Error inserting assignment:', err);
              } else {
                assignmentCount++;
                console.log(`Assigned employee ${empId} to team ${teamId}`);
              }
              
              // After inserting all assignments, we're done
              if (assignmentCount === assignments.length) {
                console.log('Sample data seeding completed.');
                resolve();
              }
            }
          );
        } else {
          assignmentCount++;
          if (assignmentCount === assignments.length) {
            console.log('Sample data seeding completed.');
            resolve();
          }
        }
      });
    });
  });
}

module.exports = { db, logAction, seedDatabase };