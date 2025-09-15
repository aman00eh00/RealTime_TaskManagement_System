const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// SQLite Database Setup
const db = new sqlite3.Database('./tasks.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      assigned_to TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// API Routes
app.get('/tasks', (req, res) => {
  db.all('SELECT * FROM tasks', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ tasks: rows });
  });
});

app.post('/tasks', (req, res) => {
  const { title, description, status, assigned_to } = req.body;
  db.run(`INSERT INTO tasks (title, description, status, assigned_to) VALUES (?, ?, ?, ?)`,
    [title, description, status || 'pending', assigned_to], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const newTask = {
      id: this.lastID,
      title,
      description,
      status: status || 'pending',
      assigned_to,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    io.emit('taskCreated', newTask);
    res.json({ id: this.lastID, message: 'Task created successfully' });
  });
});

app.put('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, status, assigned_to } = req.body;
  db.run(`UPDATE tasks SET title = ?, description = ?, status = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [title, description, status, assigned_to, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    const updatedTask = {
      id: parseInt(id),
      title,
      description,
      status,
      assigned_to,
      updated_at: new Date().toISOString()
    };
    io.emit('taskUpdated', updatedTask);
    res.json({ message: 'Task updated successfully' });
  });
});

app.delete('/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    io.emit('taskDeleted', { id: parseInt(id) });
    res.json({ message: 'Task deleted successfully' });
  });
});

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  console.log(`Client connected with socketId: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected with socketId: ${socket.id}`);
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
