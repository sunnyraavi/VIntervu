const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');

const { processResume } = require('../services/resumeProcessor');
const { startInterview, getNextQuestion, recordResponse, endInterview, getResults } = require('../services/interviewService');

// Configure multer for disk storage (PDF only)
const storage = multer.diskStorage({
  destination: 'Uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}.pdf`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Predefined skills for job roles
const roleSkills = {
  'data scientist': ['python', 'machine learning', 'data analysis', 'pandas', 'numpy', 'tensorflow', 'statistics'],
  'machine learning engineer': ['python', 'machine learning', 'tensorflow', 'scikit-learn', 'deep learning', 'pytorch'],
  'ai engineer': ['python', 'neural networks', 'nlp', 'computer vision', 'tensorflow', 'keras', 'pytorch'],
  'web developer': ['html', 'css', 'javascript', 'react', 'nodejs', 'express', 'mongodb'],
  'frontend developer': ['html', 'css', 'javascript', 'react', 'redux', 'tailwind'],
  'backend developer': ['python', 'flask', 'django', 'rest api', 'postgresql', 'mysql'],
  'full stack developer': ['html', 'css', 'javascript', 'nodejs', 'react', 'mongodb', 'express', 'flask'],
  'software engineer': ['data structures', 'algorithms', 'oop', 'python', 'java', 'c++'],
  'data analyst': ['excel', 'sql', 'power bi', 'tableau', 'python', 'pandas'],
  'devops engineer': ['linux', 'docker', 'kubernetes', 'jenkins', 'aws', 'terraform', 'ci/cd'],
  'cloud engineer': ['aws', 'azure', 'gcp', 'devops', 'linux', 'cloudformation'],
  'mobile app developer': ['flutter', 'react native', 'android', 'ios', 'dart', 'kotlin', 'swift'],
  'android developer': ['kotlin', 'java', 'android studio', 'xml'],
  'ios developer': ['swift', 'objective-c', 'xcode'],
  'ui ux designer': ['figma', 'adobe xd', 'sketch', 'wireframing', 'prototyping'],
  'qa engineer': ['test cases', 'selenium', 'manual testing', 'automation', 'pytest'],
  'security analyst': ['network security', 'firewall', 'vulnerability scanning', 'siem', 'linux'],
  'network engineer': ['ccna', 'routing', 'switching', 'tcp/ip', 'firewalls'],
  'blockchain developer': ['solidity', 'ethereum', 'smart contracts', 'web3', 'ganache'],
  'game developer': ['unity', 'unreal engine', 'c#', '3d modeling', 'blender'],
  'database administrator': ['sql', 'mysql', 'postgresql', 'oracle', 'backup', 'tuning']
};

// General suggestions for skills
const skillSuggestions = {
  'python': 'Enhance Python by building small projects or solving problems on LeetCode.',
  'machine learning': 'Take an ML course on Coursera or Udemy.',
  'tensorflow': 'Practice TensorFlow by building a neural network model.',
  'pytorch': 'Use PyTorch for building deep learning models—check tutorials from official docs.',
  'docker': 'Learn Docker by containerizing a sample app.',
  'aws': 'Start with AWS Free Tier and deploy a basic application.',
  'html': 'Build a simple portfolio website to showcase your HTML/CSS skills.',
  'css': 'Experiment with Flexbox, Grid, and animations in CSS.',
  'javascript': 'Make interactive web pages with JS, like a calculator or to-do list.',
  'react': 'Build a React-based UI project like a blog or resume site.',
  'nodejs': 'Create a simple backend API with Node.js and Express.',
  'sql': 'Practice SQL queries using online playgrounds like Mode Analytics or W3Schools.',
  'excel': 'Master formulas and pivot tables in Excel.',
  'flutter': 'Create a simple mobile app with Flutter and Dart.',
  'java': 'Build an OOP-based app like a library system using Java.',
  'c++': 'Improve C++ by solving problems on HackerRank or Codeforces.',
  'oop': 'Understand object-oriented concepts with small examples.',
  'linux': 'Use Linux CLI and try setting up a basic server.',
  'figma': 'Design a simple mobile or web app UI using Figma.',
  'selenium': 'Automate browser actions using Selenium WebDriver.',
  'blockchain': 'Explore smart contract development with Solidity and Remix IDE.',
  'unity': 'Build a 2D game using Unity\'s basic features.'
};

// Common branches for branch detection
const branches = [
  'computer science', 'cs', 'information technology', 'it',
  'electronics', 'ece', 'electrical', 'ee',
  'mechanical', 'me', 'civil', 'ce'
];

// Ping endpoint
router.get('/ping', (req, res) => {
  res.json({ message: 'Pong from backend!' });
});

// Endpoint for ResumeAnalyzer
router.post('/analyze-resume', upload.single('file'), async (req, res, next) => {
  try {
    console.log('Analyze resume request:', {
      file: req.file ? { originalname: req.file.originalname, path: req.file.path, mimetype: req.file.mimetype } : null,
      job_role: req.body.job_role
    });

    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: 'No file uploaded or file path missing' });
    }

    const role = req.body.job_role?.toLowerCase()?.trim() || '';
    if (!role || !roleSkills[role]) {
      return res.status(400).json({ error: 'Invalid or unsupported job role' });
    }

    // Process resume
    let skills1, projects1, branch1;
    try {
      ({ skills: skills1, projects: projects1, branch: branch1 } = await processResume(req.file.path));
      console.log('Resume processed:', {  skills1, projects1, branch1 });
    } catch (err) {
      console.error('Resume processing error:', err.message);
      return res.status(400).json({ error: 'Failed to process resume', details: err.message });
    }

    // Analyze skills
    const requiredSkills = roleSkills[role].map(skill => skill.toLowerCase());
skills1 = skills1.map(skill => skill.toLowerCase());

// Create a Set for faster lookup
const requiredSkillsSet = new Set(requiredSkills);

// Filter the matching skills
const foundKeywords = [...new Set(
  skills1.filter(skill => requiredSkillsSet.has(skill))
)];

// Get the missing skills
const missingSkills = requiredSkills.filter(skill => !foundKeywords.includes(skill));

// Calculate score
const score = Math.round((foundKeywords.length / requiredSkills.length) * 100 * 100) / 100;

// Generate suggestions
const suggestions = missingSkills.map(skill =>
  skillSuggestions[skill] || `Consider learning ${skill} to improve your profile.`
);


    console.log('Resume analyzed:', { role, score, foundKeywords, missingSkills });

    res.json({
      analysis: {
        role,
        score,
        found_keywords: foundKeywords,
        missing_keywords: missingSkills,
        suggestions
      }
    });
  } catch (error) {
    // Ensure file deletion on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
        console.log('Deleted file on error:', req.file.path);
      } catch (err) {
        console.error('File deletion error on catch:', err.message);
      }
    }
    console.error('Analyze resume error:', error.message, error.stack);
    next(error);
  }
});

// Upload resume endpoint for interview
router.post('/upload-resume', upload.single('resume'), async (req, res, next) => {
  try {
    console.log('Upload request:', {
      file: req.file ? { originalname: req.file.originalname, path: req.file.path, mimetype: req.file.mimetype } : null
    });

    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: 'No file uploaded or file path missing' });
    }

    // Process resume
    let skills, projects, branch;
    try {
      ({ skills, projects, branch } = await processResume(req.file.path));
      console.log('Resume processed:', { skills, projects, branch });
    } catch (err) {
      console.error('Resume processing error:', err.message);
      return res.status(400).json({ error: 'Failed to process resume', details: err.message });
    }

    // Delete file
    try {
      await fs.unlink(req.file.path);
      console.log('Deleted file:', req.file.path);
    } catch (err) {
      console.error('File deletion error:', err.message);
    }

    res.json({ skills, projects, branch });
  } catch (error) {
    // Ensure file deletion on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
        console.log('Deleted file on error:', req.file.path);
      } catch (err) {
        console.error('File deletion error on catch:', err.message);
      }
    }
    console.error('Upload error:', error.message, error.stack);
    next(error);
  }
});

// Interview endpoints
router.post('/start', async (req, res, next) => {
  try {
    const { skills, branch } = req.body;
    console.log('Start interview:', { skills, branch });
    await startInterview(skills, branch);
    res.json({ message: 'Interview started' });
  } catch (error) {
    console.error('Start interview error:', error.message, error.stack);
    next(error);
  }
});

router.get('/next-question', async (req, res, next) => {
  try {
    const question = await getNextQuestion();
    console.log('Next question sent:', question);
    res.json({ question });
  } catch (error) {
    console.error('Next question error:', error.message, error.stack);
    next(error);
  }
});

router.post('/record-response', async (req, res, next) => {
  try {
    const { audio, question } = req.body;
    console.log('Received record request:', { audio, question });
    if (!audio && audio !== '') {
      console.error('No audio provided');
      return res.status(400).json({ error: 'No audio provided' });
    }
    const result = await recordResponse(audio, question);
    console.log('Record response sent:', result);
    res.json(result);
  } catch (error) {
    console.error('Record response error:', error.message, error.stack);
    next(error);
  }
});

router.post('/end-interview', async (req, res, next) => {
  try {
    const results = await endInterview();
    console.log('End interview results sent:', results);
    res.json(results);
  } catch (error) {
    console.error('End interview error:', error.message, error.stack);
    next(error);
  }
});
router.post('/api/feedback', async (req, res) => {
  try {
    const {
    
      email = '',
      totalScore,
      maxScore,
      percentage,
      
      timestamp = new Date()
    } = req.body;

    const feedback = new Feedback({
  
      email,
      totalScore,
      maxScore,
      percentage,
      
      timestamp,
    });

    await feedback.save();
    res.status(201).json({ message: 'Feedback stored successfully' });
  } catch (error) {
    console.error('Error storing feedback:', error);
    res.status(500).json({ error: 'Failed to store feedback' });
  }
});

router.get('/results', async (req, res, next) => {
  try {
    const results = await getResults();
    console.log('Results sent:', results);
    res.json(results);
  } catch (error) {
    console.error('Results error:', error.message, error.stack);
    next(error);
  }
});

module.exports = router;
