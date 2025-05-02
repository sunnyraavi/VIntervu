const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
 
  email: { type: String },
  totalScore: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  percentage: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
