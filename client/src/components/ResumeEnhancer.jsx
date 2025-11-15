import React, { useState } from "react";
import axios from "axios";

function ResumeEnhancer() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quality, setQuality] = useState("");
  const [activeTab, setActiveTab] = useState("enhance"); // to toggle sections

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError("");
    setQuality("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Please upload a PDF resume first.");

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    setError("");
    setQuality("");

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/interview/enhance-resume`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setResult(res.data);
      setActiveTab("enhance");
    } catch (err) {
      setError("Failed to process your resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeQuality = async () => {
    if (!result?.enhanced_resume) return;
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/interview/evaluate-quality`,
        { text: result.enhanced_resume }
      );
      setQuality(res.data.feedback);
      setActiveTab("quality");
    } catch (err) {
      setError("Failed to analyze resume quality. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 text-gray-900">
      <div className="max-w-3xl w-full bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Smart Resume Enhancer
        </h2>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="text-left mb-6">
          <label className="block mb-2 font-medium">Upload Resume (PDF)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="border w-full mb-4 p-2 rounded-md"
          />
          <button
            type="submit"
            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-md"
          >
            {loading ? "Enhancing..." : "Enhance Resume"}
          </button>
        </form>

        {error && <p className="mt-4 text-red-600">{error}</p>}

        {/* Buttons Row (Enhance / Quality / Summary) */}
        {result && (
          <div className="flex flex-wrap justify-between gap-3 mb-6">
            <button
              onClick={() => setActiveTab("enhance")}
              className={`flex-1 py-2 rounded-md text-white ${
                activeTab === "enhance"
                  ? "bg-purple-600"
                  : "bg-purple-500 hover:bg-purple-600"
              }`}
            >
              ✨ Enhanced Resume
            </button>

            <button
              onClick={handleAnalyzeQuality}
              className={`flex-1 py-2 rounded-md text-white ${
                activeTab === "quality"
                  ? "bg-blue-600"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              📊 Quality Insights
            </button>

            <button
              onClick={() => setActiveTab("summary")}
              className={`flex-1 py-2 rounded-md text-white ${
                activeTab === "summary"
                  ? "bg-green-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              📝 Summary
            </button>
          </div>
        )}

        {/* Content Display Section */}
        {result && activeTab === "enhance" && result.enhanced_resume && (
          <div className="bg-gray-50 p-4 rounded-md text-sm whitespace-pre-wrap">
            {result.enhanced_resume}
          </div>
        )}

        {activeTab === "quality" && quality && (
          <div className="bg-gray-50 p-4 rounded-md text-sm whitespace-pre-wrap">
            {quality}
          </div>
        )}

        {result && activeTab === "summary" && result.summary && (
          <div className="bg-gray-50 p-4 rounded-md text-sm whitespace-pre-wrap">
            {result.summary}
          </div>
        )}

        {/* Download Button */}
        {result?.pdfPath && (
          <div className="mt-6 text-center">
            <a
              href={`${import.meta.env.VITE_API_URL}/api/interview/download-enhanced/${result.pdfPath.replace(
                /^.*[\\/]/,
                ""
              )}`}
              className="inline-block bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
              download
            >
              ⬇️ Download Enhanced Resume (PDF)
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeEnhancer;
