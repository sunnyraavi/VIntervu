import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [branch, setBranch] = useState('');
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const resetForm = () => {
    setFile(null);
    setSkills([]);
    setProjects([]);
    setBranch('');
    setError('');
    setUploaded(false);
    document.getElementById('resume').value = ''; // Clear file input
  };

  const handleUploadOrReupload = async () => {
    if (!uploaded) {
      if (!file) return;

      const formData = new FormData();
      formData.append('resume', file);

      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/interview/upload-resume`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const { skills: extractedSkills, projects: extractedProjects, branch: inferredBranch } = res.data;

        if (!extractedSkills || extractedSkills.length === 0) {
          setError('Resume parsing incomplete. Please try again.');
          setUploaded(true);
          return;
        }

        setSkills(extractedSkills);
        setProjects(extractedProjects);
        setBranch(inferredBranch);
        setError('');
        setUploaded(true);
      } catch (err) {
        console.error('Upload failed:', err);
        setError('An error occurred. Please try again.');
        setUploaded(true);
      }
    } else {
      resetForm();
    }
  };

  const handleStartInterview = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/interview/start`, { skills, branch });
      navigate('/interview');
    } catch (error) {
      console.error('Error starting interview:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-100 to-purple-300 p-6 mt-10">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold text-center text-purple-600 mb-6">Upload Your Resume</h2>

        <div className="mb-4">
          <label htmlFor="resume" className="block text-lg font-medium mb-2 text-gray-700">
            Choose a Resume File (.pdf, .docx)
          </label>
          <input
            type="file"
            id="resume"
            accept=".pdf,.docx"
            onChange={(e) => {
              setFile(e.target.files[0]);
              setError('');
            }}
            className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        {error && (
          <div className="mb-4 text-red-600 font-semibold bg-red-100 border border-red-300 p-3 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handleUploadOrReupload}
          disabled={!file && !uploaded}
          className={`w-full py-3 mt-2 ${
            (!file && !uploaded) ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
          } text-white font-semibold rounded-lg shadow-md transition-all duration-300`}
        >
          {uploaded ? 'Re-upload Resume' : 'Upload Resume'}
        </button>

        {skills.length > 0 && (
          <div className="mt-6 p-6 bg-gray-100 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold text-purple-600 mb-4">Extracted Information</h3>
            <p className="text-lg font-medium mb-2">
              <strong>Skills:</strong> {skills.join(', ')}
            </p>
            <p className="text-lg font-medium mb-2">
              <strong>Projects:</strong> {projects.length > 0 ? projects.join(', ') : 'No projects found'}
            </p>
            <p className="text-lg font-medium mb-4">
              <strong>Inferred Branch:</strong> {branch || 'Unknown'}
            </p>
            <button
              onClick={handleStartInterview}
              className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300 hover:bg-purple-700"
            >
              Start Interview
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeUpload;