const express = require('express');
const User = require('./models/User');
const Exercise = require('./models/Exercise');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json()); // For parsing incoming JSON requests
app.use(express.urlencoded({ extended: true })); // For parsing URL-encoded data

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit the process if the DB connection fails
  });

// Create a new user (POST request)
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) return res.status(400).json({ error: 'Username is required' });

    const newUser = new User({ username });
    const savedUser = await newUser.save();

    res.json({
      username: savedUser.username,
      _id: savedUser._id
    });
  } catch (err) {
    console.error('Error in creating user:', err);
    res.status(500).json({ error: 'Server error while creating user' });
  }
});

// Get all users (GET request)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error('Error in fetching users:', err);
    res.status(500).json({ error: 'Server error while fetching users' });
  }
});

// Add an exercise for a specific user (POST request)
app.post('/api/users/:id/exercises', async (req, res) => {
  try {
    const { id } = req.params; // Get userId from the URL
    const { description, duration, date } = req.body;

    // Check if required fields are present
    if (!description || !duration) {
      return res.status(400).json({ error: 'Description and duration are required' });
    }

    const exerciseDate = date ? new Date(date).toDateString() : new Date().toDateString();

    // Create and save the new exercise
    const newExercise = new Exercise({
      description,
      duration,
      date: exerciseDate
    });

    const savedExercise = await newExercise.save();

    // Find the user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add the exercise to the user's exercise list
    user.exercises.push(savedExercise);
    await user.save();

    // Respond with the user's exercise details (correct format)
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

// Get the exercise log for a specific user (GET request)
app.get('/api/users/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to, limit } = req.query;

    // Find the user by ID
    const user = await User.findById(id).populate('exercises');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let exercises = user.exercises;

    // Filter by date range if `from` and `to` are provided
    if (from) {
      exercises = exercises.filter((exercise) => new Date(exercise.date) >= new Date(from));
    }

    if (to) {
      exercises = exercises.filter((exercise) => new Date(exercise.date) <= new Date(to));
    }

    // Limit the number of exercises if `limit` is provided
    if (limit) {
      exercises = exercises.slice(0, limit);
    }

    // Return the user's log with a count of exercises
    res.json({
      _id: user._id,
      username: user.username,
      count: exercises.length,
      log: exercises.map(exercise => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date
      }))
    });
  } catch (err) {
    console.error('Error while fetching user log:', err);
    res.status(500).json({ error: 'Server error while fetching log' });
  }
});

// Start the server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
