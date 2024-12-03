const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// In-memory databases
let userDatabase = {}; // Format: { _id: { username, _id } }
let exerciseLog = {}; // Format: { _id: [ { description, duration, date } ] }

// Endpoint to create a new user
app.post('/api/users', function (req, res) {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const userId = uuidv4();
  userDatabase[userId] = { username, _id: userId };
  exerciseLog[userId] = [];

  res.json({ username, _id: userId });
});

// Endpoint to get all users
app.get('/api/users', function (req, res) {
  const users = Object.values(userDatabase);
  res.json(users);
});

// Endpoint to add an exercise
app.post('/api/users/:_id/exercises', function (req, res) {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  if (!userDatabase[_id]) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!description || !duration) {
    return res.status(400).json({ error: 'Description and duration are required' });
  }

  const parsedDate = date ? new Date(date) : new Date();
  if (isNaN(parsedDate)) {
    return res.status(400).json({ error: 'Invalid date' });
  }

  const exercise = {
    description,
    duration: Number(duration),
    date: parsedDate.toDateString()
  };

  exerciseLog[_id].push(exercise);

  res.json({
    username: userDatabase[_id].username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
    _id
  });
});

// Endpoint to get a user's exercise log
app.get('/api/users/:_id/logs', function (req, res) {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  if (!userDatabase[_id]) {
    return res.status(404).json({ error: 'User not found' });
  }

  let logs = exerciseLog[_id];
  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate)) {
      logs = logs.filter(log => new Date(log.date) >= fromDate);
    }
  }

  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate)) {
      logs = logs.filter(log => new Date(log.date) <= toDate);
    }
  }

  if (limit) {
    logs = logs.slice(0, Number(limit));
  }

  res.json({
    username: userDatabase[_id].username,
    count: logs.length,
    _id,
    log: logs
  });
});

// Listener
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
