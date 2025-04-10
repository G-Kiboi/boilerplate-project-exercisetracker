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

    // Check if username is provided
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Create and save the new user
    const newUser = new User({ username });
    const savedUser = await newUser.save();

    // Respond with the new user details
    res.json({
      username: savedUser.username,
      _id: savedUser._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while creating user' });
  }
});

// Get all users (GET request)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err);
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

    // Use the current date if no date is provided
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

    // Respond with the user's exercise details
    res.json({
      _id: user._id,
      username: user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: savedExercise.date
    });
  } catch (err) {
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      console.error('Validation Error:', err);
      return res.status(400).json({ error: 'Validation Error', details: err.message });
    }

    console.error(err);
    res.status(500).json({ error: 'Server error while adding exercise' });
  }
});

// Start the server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
