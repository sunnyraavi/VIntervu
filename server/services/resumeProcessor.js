const fs = require('fs').promises;
const path = require('path');
const PDFParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 🔐 Replace with your Gemini API key (preferably from .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function processResume(filePath) {
  try {
    console.log('Processing file at:', filePath);
    await fs.access(filePath).catch(err => {
      throw new Error(`File not accessible: ${err.message}`);
    });

    const ext = path.extname(filePath).toLowerCase();
    if (!ext) throw new Error('File has no extension');

    let text = '';
    if (ext === '.pdf') {
      console.log('Parsing PDF');
      const dataBuffer = await fs.readFile(filePath);
      const pdf = await PDFParse(dataBuffer);
      text = pdf.text || '';
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }

    console.log('Extracted text snippet:', text.substring(0, 100));

    // Extract skills and projects
    const { skills, projects } = await extractSkillsAndProjectsWithGemini(text);
    const branch = inferBranch(skills);

    await fs.unlink(filePath).catch(err => console.error('Error deleting file:', err));
    return { skills, projects, branch };
  } catch (error) {
    console.error('Resume processing error:', error.message, error.stack);
    throw error;
  }
}

// 🧠 Gemini-powered skill and project extraction
async function extractSkillsAndProjectsWithGemini(text) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Extract the following information from the resume text:
1. A list of all skills (technical, soft, domain-specific, etc.).
2. A list of project titles only.

Respond in JSON format like this:
{
  "skills": ["Skill1", "Skill2", "Skill3", ...],
  "projects": ["Project Title 1", "Project Title 2", "Project Title 3", ...]
}

Resume Text:
${text.substring(0, 4000)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const message = response.text().trim();

    // Try to safely parse the JSON response
    const jsonStart = message.indexOf('{');
    const jsonEnd = message.lastIndexOf('}') + 1;
    const jsonString = message.slice(jsonStart, jsonEnd);

    const { skills, projects } = JSON.parse(jsonString);

    return {
      skills: Array.isArray(skills) ? skills : [],
      projects: Array.isArray(projects) ? projects : []
    };
  } catch (error) {
    console.error('Error extracting skills and projects with Gemini:', error.message);
    return { skills: [], projects: [] };
  }
}

function inferBranch(skills) {
  if (!skills.length) return 'Unknown';
  const skillSet = new Set(skills.map(s => s.toLowerCase()));

  if ([...skillSet].some(skill => ['python', 'java', 'c++', 'javascript', 'sql', 'machine learning', 'aws'].includes(skill))) return 'CSE';
  if ([...skillSet].some(skill => ['matlab', 'vlsi'].includes(skill))) return 'ECE';
  if ([...skillSet].some(skill => ['plc', 'scada'].includes(skill))) return 'EEE';
  if ([...skillSet].some(skill => ['autocad', 'staad'].includes(skill))) return 'Civil';

  return 'Unknown';
}

module.exports = { processResume, extractSkillsAndProjectsWithGemini, inferBranch };

