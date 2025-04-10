const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});
// Add a reference to exercises for each user
userSchema.add({
    exercises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }]
  });
  
module.exports = mongoose.model('User', userSchema);
