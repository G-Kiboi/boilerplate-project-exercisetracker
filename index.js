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
app.use(express.json()); // Use express.json() for parsing incoming JSON requests
app.use(express.urlencoded({ extended: true })); // For URL-encoded data

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

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
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users (GET request)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
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

    const newExercise = new Exercise({
      description,
      duration,
      date: exerciseDate
    });

    const savedExercise = await newExercise.save();

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

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
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start the server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
