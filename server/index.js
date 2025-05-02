const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require("nodemailer");
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const { exec } = require('child_process'); // For executing Python script
require('dotenv').config();
const path = require('path');
const fs = require('fs/promises'); // for file operations

const interviewRoutes = require('./routes/interview');
const User = require('./models/User');
const Feedback = require('./models/Feedback'); // Assuming you've defined this model correctly

console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set' : 'Not set');

const app = express();
const router = express.Router(); // Create a new router instance

app.use(cors());
app.use(express.json());
app.use('/api/interview', interviewRoutes);
app.use(bodyParser.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// Route: Login with Email
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.get('/api/feedback/:email', async (req, res) => {
  const email = req.params.email;

  try {
    const feedback = await Feedback.find({ email }).sort({ timestamp: -1 });
    console.log("Feedback Retrieved: ", feedback); // Log all feedback records for the user
    
    if (feedback.length === 0) {
      return res.status(404).json({ message: "No feedback found for this email." });
    }
    
    res.json(feedback); // Send back all feedback data
  } catch (err) {
    console.error("Error fetching feedback:", err);
    res.status(500).json({ message: "Server error while fetching feedback." });
  }
});




// Route: Sign Up
app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'Signup successful', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to store user feedback
router.post('/api/feedback', async (req, res) => {
  const { name, email, totalScore, maxScore, percentage } = req.body;

  if (totalScore === undefined || maxScore === undefined || percentage === undefined) {
    return res.status(400).json({ error: 'Total score, max score, and percentage are required' });
  }

  const feedback = new Feedback({
    
    email: email || '',
    totalScore,
    maxScore,
    percentage,
    timestamp: new Date(),
  });

  try {
    // Save feedback to the MongoDB database
    await feedback.save();
    console.log('Feedback stored:', feedback);

    res.json({ message: 'Thank you for your feedback!' });
  } catch (err) {
    console.error('Failed to store feedback:', err.message);
    res.status(500).json({ error: 'Failed to store feedback' });
  }
});

// Email Sending Endpoint
app.post("/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_USER,
      subject: "New Contact Form Message from Vintervu",
      text: message,
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Message:</strong><br/>${message}</p>`,
    });

    res.status(200).json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("Email sending failed:", error);
    res.status(500).json({ error: "Failed to send email. Please try again later." });
  }
});

// Use the router in the app
app.use(router);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
