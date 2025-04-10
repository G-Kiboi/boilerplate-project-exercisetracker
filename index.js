const express = require('express');
const User = require('./models/User');
const Exercise = require('./models/exercise');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json()); // Use express.json() for parsing incoming JSON requests
app.use(express.urlencoded({ extended: true })); // For URL-encoded data

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit the process if DB connection fails
  });

// Create a new user (POST request)
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const newUser = new User({ username });
    const savedUser = await newUser.save();

    res.json({
      username: savedUser.username,
      _id: savedUser._id
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Server error while creating user' });
  }
});

// Get all users (GET request)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error('Error retrieving users:', err);
    res.status(500).json({ error: 'Server error while retrieving users' });
  }
});

// Add an exercise for a specific user
app.post('/api/users/:id/exercises', async (req, res) => {
  try {
    const { id } = req.params; // Get userId from the URL
    const { description, duration, date } = req.body;

    if (!description || !duration) {
      return res.status(400).json({ error: 'Description and duration are required' });
    }

    const exerciseDate = date ? new Date(date).toDateString() : new Date().toDateString();

    // Create a new exercise
    const newExercise = new Exercise({
      description,
      duration,
      date: exerciseDate
    });

    // Save the exercise
    const savedExercise = await newExercise.save();

    // Find the user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add the exercise to the user's exercises array
    user.exercises.push(savedExercise);
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: savedExercise.date
    });
  } catch (err) {
    console.error('Error while adding exercise:', err);
    res.status(500).json({ error: 'Server error while adding exercise' });
  }
});

// Get exercise logs for a specific user
app.get('/api/users/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to, limit } = req.query;

    // Find the user by ID
    const user = await User.findById(id).populate('exercises');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let logs = user.exercises;

    // Filter logs by date range (from and to)
    if (from || to) {
      logs = logs.filter((exercise) => {
        const exerciseDate = new Date(exercise.date);
        const fromDate = from ? new Date(from) : null;
        const toDate = to ? new Date(to) : null;

        if (fromDate && exerciseDate < fromDate) {
          return false;
        }
        if (toDate && exerciseDate > toDate) {
          return false;
        }
        return true;
      });
    }

    // Apply limit
    if (limit) {
      logs = logs.slice(0, limit);
    }

    // Format the logs into the expected structure
    const log = logs.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date
    }));

    res.json({
      _id: user._id,
      username: user.username,
      count: log.length,
      log: log
    });
  } catch (err) {
    console.error('Error retrieving logs:', err);
    res.status(500).json({ error: 'Server error while retrieving logs' });
  }
});

// Start the server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
