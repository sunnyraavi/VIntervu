const { GoogleGenerativeAI } = require('@google/generative-ai');
const { generateBasicQuestions, generateInitialTechnicalQuestions, generateDynamicQuestion } = require('./questionGenerator');
const { recognizeSpeech, synthesizeSpeech } = require('./speechProcessor');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

let sessionState = {
  skills: [],
  branch: '',
  questions: [],
  responses: [],
  currentQuestionIndex: 0,
  feedback: [],
  scores: [],
};

async function startInterview(skills, branch) {
  try {
    sessionState = {
      skills,
      branch,
      questions: [],
      responses: [],
      currentQuestionIndex: 0,
      feedback: [],
      scores: [],
    };
    const basicQuestions = await generateBasicQuestions();
    const technicalQuestions = await generateInitialTechnicalQuestions(skills,branch);
    sessionState.questions = [...basicQuestions, ...technicalQuestions];
    console.log('Interview started. Questions:', sessionState.questions.length, sessionState.questions);
  } catch (error) {
    console.error('Start interview error:', error.message, error.stack);
    throw error;
  }
}

async function getNextQuestion() {
  try {
    console.log('Get next question. State:', {
      index: sessionState.currentQuestionIndex,
      questions: sessionState.questions,
      questionCount: sessionState.questions.length,
    });

    if (sessionState.currentQuestionIndex >= sessionState.questions.length) {
      if (sessionState.currentQuestionIndex >= 35) {
        console.log('Max questions reached');
        return null;
      }
      const question = await generateDynamicQuestion(
        sessionState.responses,
        sessionState.skills,
        sessionState.branch
      );
      sessionState.questions.push(question);
      console.log('Dynamic question added:', question);
    }

    const question = sessionState.questions[sessionState.currentQuestionIndex];
    await synthesizeSpeech(question);
    console.log('Returning question:', question, 'Index:', sessionState.currentQuestionIndex);
    return question;
  } catch (error) {
    console.error('Get next question error:', error.message, error.stack);
    throw error;
  }
}

async function recordResponse(audio, question) {
  try {
    console.log('Recording response:', audio, 'for question:', question);
    const response = await recognizeSpeech(audio);
    sessionState.responses.push(response);

    // Score response using Gemini
    let score = 2; // Default for empty/irrelevant
    if (response && response !== 'No speech detected') {
      const prompt = `
        Evaluate the following interview response for question "${question}":
        Response: "${response}"
        Score it from 0 to 10 based on relevance, detail, and clarity (0 = irrelevant, 10 = excellent).
        Return only the score as a number.
      `;
      try {
        const result = await model.generateContent(prompt);
        const text = (await result.response.text()).trim();
        score = parseInt(text, 10);
        if (isNaN(score) || score < 0 || score > 10) {
          score = 2;
          console.warn('Invalid score from Gemini:', text);
        }
      } catch (error) {
        console.error('Scoring error:', error.message);
      }
    }

    sessionState.scores.push(score);
    sessionState.feedback.push({
      question: question || 'Unknown',
      response,
      score,
      feedback: 'Pending detailed analysis',
    });
    sessionState.currentQuestionIndex++;
    console.log('Response recorded:', response, 'Score:', score, 'New index:', sessionState.currentQuestionIndex, 'Questions:', sessionState.questions);
    return { response, score };
  } catch (error) {
    console.error('Record response error:', error.message, error.stack);
    throw error;
  }
}

async function endInterview() {
  try {
    console.log('Ending interview. Generating feedback...');
    for (let i = 0; i < sessionState.feedback.length; i++) {
      const item = sessionState.feedback[i];
      const prompt = `
        Analyze the following interview response for question "${item.question}":
        Response: "${item.response}"
        Provide concise feedback (1-2 sentences) on the response's strengths and weaknesses.
        Suggest an alternative way to answer the question (1-2 sentences).
        Return the result as JSON with fields "feedback" and "suggestion".
      `;
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const parsed = JSON.parse(text.match(/```json\n([\s\S]*?)\n```/)?.[1] || '{}');
        sessionState.feedback[i].feedback = parsed.feedback || 'No feedback available';
        sessionState.feedback[i].suggestion = parsed.suggestion || 'No suggestion provided';
      } catch (error) {
        console.error(`Feedback generation error for Q${i + 1}:`, error.message);
        sessionState.feedback[i].feedback = 'Unable to generate feedback';
        sessionState.feedback[i].suggestion = 'Try providing more details in your response';
      }
    }

    const results = getResults();
    console.log('Interview ended. Feedback:', results);
    sessionState = {
      skills: [],
      branch: '',
      questions: [],
      responses: [],
      currentQuestionIndex: 0,
      feedback: [],
      scores: [],
    };
    return results;
  } catch (error) {
    console.error('End interview error:', error.message, error.stack);
    throw error;
  }
}

function getResults() {
  try {
    const totalScore = sessionState.scores.reduce((a, b) => a + b, 0, 0);
    const maxScore = sessionState.scores.length * 10;
    const percentage = maxScore ? (totalScore / maxScore) * 100 : 0;
    return {
      totalScore,
      maxScore,
      percentage,
      feedback: sessionState.feedback,
    };
  } catch (error) {
    console.error('Get results error:', error.message, error.stack);
    throw error;
  }
}

module.exports = {
  startInterview,
  getNextQuestion,
  recordResponse,
  endInterview,
  getResults,
};