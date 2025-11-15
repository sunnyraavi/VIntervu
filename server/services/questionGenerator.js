/*const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function generateBasicQuestions() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    const timestamp = Date.now();
    const prompt = `Generate 5 simple, concise (1 sentence) introductory interview questions, each separated by a newline... with seed: ${timestamp}.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text(); // Use text() method
    if (typeof text !== 'string') {
      throw new Error('Response text is not a string');
    }
    return text.split('\n').filter(q => q.trim());
  } catch (error) {
    console.error('Generate basic questions error:', error.message, error.stack);
    throw error;
  }
}

async function generateInitialTechnicalQuestions(skills, branch) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    const timestamp = Date.now();
    const prompt = skills.length
      ? `Generate 5 simple, concise technical questions for ${branch} based on skills: ${skills.join(', ')}, each separated by a newline... with seed: ${timestamp}.`
      : `Generate 5 simple, concise technical questions for any engineering branch, each separated by a newline... with seed: ${timestamp}.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text(); // Use text() method
    if (typeof text !== 'string') {
      throw new Error('Response text is not a string');
    }
    return text.split('\n').filter(q => q.trim());
  } catch (error) {
    console.error('Generate initial technical questions error:', error.message, error.stack);
    throw error;
  }
}

async function generateDynamicQuestion(responses, skills, branch) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    const timestamp = Date.now();
    const prompt = `Based on responses: '${responses.join(' ')}', generate a technical question for ${branch}... with seed: ${timestamp}.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text(); // Use text() method
    if (typeof text !== 'string') {
      throw new Error('Response text is not a string');
    }
    return text.trim();
  } catch (error) {
    console.error('Generate dynamic question error:', error.message, error.stack);
    throw error;
  }
}

module.exports = {
  generateBasicQuestions,
  generateInitialTechnicalQuestions,
  generateDynamicQuestion,
};*/

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Utility: word overlap for duplicate detection
function similarity(a, b) {
  const aWords = a.toLowerCase().split(/\s+/);
  const bWords = b.toLowerCase().split(/\s+/);
  const common = aWords.filter(word => bWords.includes(word));
  return common.length / Math.max(aWords.length, 1);
}

// Utility: remove empty/duplicate questions
function filterQuestions(rawText, askedQuestions) {
  return rawText
    .split('\n')
    .map(q => q.trim())
    .filter(q => q && !askedQuestions.some(aq => similarity(aq, q) > 0.7));
}

// 🔹 1. Generate Basic Introductory Questions
async function generateBasicQuestions(askedQuestions = []) {
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');

    const prompt = `
Generate 5 basic introductory interview questions (one sentence each).
Keep them general (e.g., background, interests, motivation) — not technical.
Avoid repetition. Separate each on a new line.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return filterQuestions(text, askedQuestions).slice(0, 5);
  } catch (error) {
    console.error('Basic question generation error:', error.message);
    throw error;
  }
}

// 🔹 2. Generate Initial Technical Questions (skills + core topics)
async function generateInitialTechnicalQuestions(skills, branch, askedQuestions = []) {
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');

    const skillList = skills.length ? skills.join(', ') : 'basic technical knowledge';
    const coreTopics = getCoreTopics(branch).join(', ');

    const prompt = `
Generate 5 technical interview questions for a ${branch} student.
Base the questions on both resume skills (${skillList}) and core subjects of ${branch} (${coreTopics}).
Keep questions at basic to intermediate level. Each should be clear, simple, and one sentence long.
Avoid abstract, niche, or very complex topics. Output each on a new line.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return filterQuestions(text, askedQuestions).slice(0, 5);
  } catch (error) {
    console.error('Initial technical question error:', error.message);
    throw error;
  }
}

// 🔹 3. Generate Follow-Up Question (based on response + branch core)
async function generateDynamicQuestion(responses, skills, branch, askedQuestions = []) {
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');

    const lastAnswer = responses.slice(-1)[0] || '';
    const skillList = skills.length ? skills.join(', ') : 'basic concepts';
    const coreConcepts = getCoreTopics(branch).join(', ');

    const prompt = `
You are conducting a technical interview for a ${branch} student.
Based on the last response: "${lastAnswer}", their skills: ${skillList}, and core ${branch} topics: ${coreConcepts},
generate one **new**, non-repeating follow-up question.
Keep it basic to intermediate, clear, and 1 sentence. Do not repeat earlier questions or words from the response.
Only output the question text.
    `;

    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const question = response.text().trim();

      if (question && !askedQuestions.some(q => similarity(q, question) > 0.7)) {
        return question;
      }

      attempts++;
    }

    throw new Error('No unique follow-up question could be generated.');
  } catch (error) {
    console.error('Follow-up question generation error:', error.message);
    throw error;
  }
}

// 🔹 4. Get Core Topics by Branch
function getCoreTopics(branch) {
  const coreMap = {
    'Computer Science': ['Data Structures', 'Algorithms', 'Operating Systems', 'DBMS', 'Computer Networks', 'OOP'],
    'Electrical': ['Circuits', 'Control Systems', 'Signal Processing', 'Power Systems', 'Electromagnetics'],
    'Mechanical': ['Thermodynamics', 'Fluid Mechanics', 'Heat Transfer', 'Strength of Materials', 'Machine Design'],
    'Civil': ['Structural Analysis', 'Concrete Technology', 'Geotechnical Engineering', 'Transportation Engineering'],
    'Electronics': ['Analog Circuits', 'Digital Logic', 'Microprocessors', 'Embedded Systems', 'VLSI'],
    // Add more as needed
  };

  return coreMap[branch] || ['basic engineering topics'];
}

module.exports = {
  generateBasicQuestions,
  generateInitialTechnicalQuestions,
  generateDynamicQuestion,
};