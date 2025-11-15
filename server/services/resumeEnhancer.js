/*const fs = require('fs').promises;
const path = require('path');
const PDFParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function enhanceResume(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const pdf = await PDFParse(dataBuffer);
    const text = pdf.text || '';

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are a professional resume enhancement assistant.
Enhance the following resume text by:
1. Correcting grammar and formatting.
2. Improving phrasing and impact.
3. Suggesting missing sections (if any).
4. Summarizing the resume in 3–4 lines.

Respond in JSON format like this:
{
  "enhanced_resume": "Improved version of the resume text...",
  "summary": "Concise summary of the resume..."
}

Resume Text:
${text.substring(0, 5000)}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}') + 1;
    const jsonString = responseText.slice(jsonStart, jsonEnd);

    const parsed = JSON.parse(jsonString);

    await fs.unlink(filePath);
    return parsed;
  } catch (error) {
    console.error('Error enhancing resume:', error.message);
    return { enhanced_resume: '', summary: '', error: error.message };
  }
}

module.exports = { enhanceResume };*/
const fs = require('fs').promises;
const path = require('path');
const PDFParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const PDFDocument = require('pdfkit');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function enhanceResume(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const pdf = await PDFParse(dataBuffer);
    const text = pdf.text || '';

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are a professional resume enhancement assistant.
Enhance the following resume text by:
1. Correcting grammar and formatting.
2. Improving phrasing and impact.
3. Suggesting missing sections (if any).
4. Summarizing the resume in 3–4 lines.

Respond in JSON format like this:
{
  "enhanced_resume": "Improved version of the resume text...",
  "summary": "Concise summary of the resume..."
}

Resume Text:
${text.substring(0, 5000)}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}') + 1;
    const jsonString = responseText.slice(jsonStart, jsonEnd);
    const parsed = JSON.parse(jsonString);

    // Generate PDF
    const pdfPath = path.join('Uploads', `Enhanced_${Date.now()}.pdf`);
    await generateEnhancedPDF(parsed, pdfPath);

    // Cleanup original file
    await fs.unlink(filePath);

    return { ...parsed, pdfPath };
  } catch (error) {
    console.error('Error enhancing resume:', error.message);
    return { enhanced_resume: '', summary: '', error: error.message };
  }
}

async function generateEnhancedPDF(data, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const stream = fs.open(outputPath, 'w');

      const writeStream = require('fs').createWriteStream(outputPath);
      doc.pipe(writeStream);

      doc.fontSize(18).fillColor('#4B0082').text('✨ Smart Resume Enhancer', { align: 'center' });
      doc.moveDown();

      doc.fontSize(14).fillColor('black').text('📝 Summary:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(data.summary || 'No summary available.');
      doc.moveDown();

      doc.fontSize(14).text('📄 Enhanced Resume:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(data.enhanced_resume || 'No content available.', { align: 'left' });

      doc.end();

      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { enhanceResume };

