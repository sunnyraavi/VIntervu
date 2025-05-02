import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bots from "/src/assets/bots.jpeg";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await axios.post('http://localhost:5000/api/login', { email, password });
      setSuccess(res.data.message);
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("logmail", email);
      window.dispatchEvent(new Event("loginStateChange")); // Notify other components
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <section className="bg-white min-h-screen">
      <div className="lg:grid lg:grid-cols-12 lg:min-h-screen">
        <div className="relative bg-gray-900 lg:col-span-6 flex items-end">
          <img
            alt="Interview Background"
            src={bots}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
          <div className="relative z-10 p-12 text-white max-w-xl">
            <a href="/" className="flex items-center space-x-2 mb-4">
              <img
                src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png"
                alt="Logo"
                className="h-8 w-8"
              />
              <span className="text-xl font-bold">VINTERVU</span>
            </a>
            <h2 className="text-3xl sm:text-4xl font-bold mb-2">Prepare smarter with AI-powered mock interviews.✨</h2>
            <p className="text-white/90">Practice real-time with a lifelike avatar and tailored questions. Build confidence, get feedback, and ace your dream job.</p>
          </div>
        </div>

        <div className="lg:col-span-6 flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-white">
          <div className="max-w-md w-full border rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-4 text-center">Sign in to VINTERVU</h2>

            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Enter your email address"
                className="w-full border px-3 py-2 mb-4 rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full border px-3 py-2 mb-4 rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
              >
                Continue →
              </button>
            </form>

            {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
            {success && <p className="text-green-600 text-sm text-center mt-2">{success}</p>}

            <p className="text-sm text-center mt-4">
              Don’t have an account?{' '}
              <a href="/signup" className="text-purple-600 hover:underline">Sign up</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
