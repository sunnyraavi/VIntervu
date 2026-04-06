import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Interview = ({ forwardedWebcamRef }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [responses, setResponses] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isInterviewEnded, setIsInterviewEnded] = useState(false);
  const [askedQuestions, setAskedQuestions] = useState(new Set());

  const webcamRef = forwardedWebcamRef || useRef(null);
  const avatarVideoRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'en-US';
      recog.maxAlternatives = 1;
      setRecognition(recog);
    } else {
      alert('Please use Chrome or Edge for speech recognition');
    }

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Webcam error:', error);
      }
    };

    startWebcam();
    fetchNextQuestion();

    return () => {
      if (recognition) recognition.stop();
      stopWebcam();
      if (avatarVideoRef.current) avatarVideoRef.current.pause();
    };
  }, []);

  const stopWebcam = () => {
    if (webcamRef.current && webcamRef.current.srcObject) {
      const tracks = webcamRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      webcamRef.current.srcObject = null;
    }
  };

  const fetchNextQuestion = async () => {
    if (isInterviewEnded) return;
    try {
      const response = await axios.get('http://localhost:5000/api/interview/next-question');
      const question = response.data.question;

      if (question && !askedQuestions.has(question)) {
        setCurrentQuestion(question);
        setAskedQuestions(prev => new Set(prev).add(question));

        if (avatarVideoRef.current) {
          avatarVideoRef.current.src = '/assets/speaking.mp4';
          avatarVideoRef.current.load();
          avatarVideoRef.current.play().catch((err) => console.error('Play error:', err));
        }
      } else {
        setCurrentQuestion(null);
      }
    } catch (error) {
      console.error('Fetch next question error:', error);
    }
  };

  const startRecording = async () => {
    if (isInterviewEnded || !recognition) return;

    if (avatarVideoRef.current) {
      avatarVideoRef.current.pause();
    }

    try {
      const permission = await navigator.permissions.query({ name: 'microphone' });
      if (permission.state === 'denied') {
        alert('Microphone access denied. Please enable it in browser settings.');
        return;
      }
    } catch (error) {
      console.error('Permission check error:', error);
    }

    setIsRecording(true);

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      await recordTranscript(transcript);
    };

    recognition.onerror = async (event) => {
      if (event.error === 'no-speech') {
        await recordTranscript('');
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Recognition start error:', error);
      setIsRecording(false);
    }
  };

  const recordTranscript = async (transcript) => {
    try {
      const response = await axios.post('http://localhost:5000/api/interview/record-response', {
        audio: transcript || 'No speech detected',
        question: currentQuestion
      });

      setResponses(prev => [
        ...prev,
        {
          question: currentQuestion,
          response: response.data.response,
          score: response.data.score
        }
      ]);

      setCurrentQuestion(null);
      await fetchNextQuestion();
    } catch (error) {
      console.error('Record response error:', error);
    }
  };

  const endInterview = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/interview/end-interview');
      setIsInterviewEnded(true);
      stopWebcam();
      if (avatarVideoRef.current) {
        avatarVideoRef.current.pause();
        avatarVideoRef.current.currentTime = 0;
      }
      navigate('/feedback', { state: response.data });
    } catch (error) {
      console.error('End interview error:', error);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentQuestion, responses]);

  return (
    <div className="flex flex-col h-screen p-5 bg-gray-100">
      <div className="flex flex-1 gap-5">
        {/* Left: Avatar + Webcam + Buttons */}
        <div className="flex flex-col items-center gap-2 w-[320px] ">
          <div className="relative w-full max-w-md border-2 border-gray-300 rounded-lg overflow-hidden">
            <video ref={avatarVideoRef} className="w-full rounded-lg" muted playsInline />
          </div>
          <video
            ref={webcamRef}
            autoPlay
            muted
            playsInline
            className="w-full max-w-md border-2 border-gray-300 rounded-lg"
          />

          {/* Buttons Positioned Below Webcam */}
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={startRecording}
              disabled={isRecording || !currentQuestion || isInterviewEnded}
              className={`px-6 py-3 text-white text-sm rounded ${
                isRecording || !currentQuestion || isInterviewEnded
                  ? 'bg-purple-500 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isRecording ? 'Recording...' : 'Record Response'}
            </button>

            <button
              onClick={endInterview}
              disabled={isInterviewEnded}
              className={`px-6 py-3 text-white text-sm rounded ${
                isInterviewEnded
                  ? 'bg-purple-500 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              End Interview
            </button>
          </div>
        </div>

        {/* Right: Scrollable Q&A Window */}
        <div className="flex flex-col w-full bg-white border border-gray-300 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2 text-center">Interview Responses</h2>

          <div
            className="flex flex-col gap-2 overflow-y-auto pr-3"
            style={{ height: '70vh' }}
          >
            {responses.map((res, index) => (
              <div key={index} className="flex flex-col gap-1">
                <div className="flex justify-start">
                  <div className="bg-purple-600 text-white px-4 py-2 rounded-2xl max-w-[70%] break-words">
                    <strong>Question:</strong> {res.question}
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-gray-500 text-white px-4 py-2 rounded-2xl max-w-[70%] break-words">
                    <strong>Answer:</strong> {res.response}
                  </div>
                </div>
              </div>
            ))}
            {currentQuestion && !isInterviewEnded && (
              <div className="flex justify-start">
                <div className="bg-purple-600 text-white px-4 py-2 rounded-2xl max-w-[70%] break-words">
                  <strong>Question:</strong> {currentQuestion}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
