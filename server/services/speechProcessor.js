const say = require('say');

async function recognizeSpeech(text) {
  try {
    // Return the transcribed text directly (sent from frontend)
    if (!text) {
      throw new Error('No speech input provided');
    }
    return text;
  } catch (error) {
    console.error('Recognize speech error:', error.message, error.stack);
    throw error;
  }
}

async function synthesizeSpeech(text) {
  try {
    return new Promise((resolve) => {
      if (!text || typeof text !== 'string') {
        console.warn('Invalid text for synthesis:', text);
        resolve(); // Don't fail interview flow on speech synthesis
        return;
      }
      say.speak(text, null, 1.0, err => {
        if (err) {
          console.error('Speech synthesis failed:', err.message);
          resolve(); // Continue interview even if speech synthesis fails
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Synthesize speech error:', error.message, error.stack);
    // Don't throw - allow interview to continue even if speech synthesis fails
  }
}

module.exports = { recognizeSpeech, synthesizeSpeech };