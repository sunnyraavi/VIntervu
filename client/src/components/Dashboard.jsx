import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { FiMenu } from 'react-icons/fi';

const Dashboard = () => {
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [view, setView] = useState('table');

  useEffect(() => {
    const email = sessionStorage.getItem('logmail');
    if (!email) {
      setError('User not logged in.');
      return;
    }

    const fetchFeedback = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/feedback/${encodeURIComponent(email)}`);
        const data = Array.isArray(res.data) ? res.data : [res.data];
        setFeedback(data);
      } catch (err) {
        console.error('Failed to fetch feedback:', err);
        setError('No feedback data available.');
      }
    };

    fetchFeedback();
  }, []);

  const chartData = feedback.map((entry, index) => ({
    name: `Attempt ${index + 1}`,
    Score: entry.totalScore,
    'Max Score': entry.maxScore,
  }));

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-md transition-all duration-300 
        ${showMenu ? 'w-64' : 'w-0'} md:w-64 overflow-hidden`}
      >
        <div className="p-6 border-b text-lg font-bold mt-20">Dashboard Menu</div>
        <ul className="p-6 space-y-4 text-gray-700">
          <li
            className={`cursor-pointer hover:text-indigo-600 transition ${view === 'table' ? 'text-indigo-600 font-semibold' : ''}`}
            onClick={() => setView('table')}
          >
            Table View
          </li>
          <li
            className={`cursor-pointer hover:text-indigo-600 transition ${view === 'graph' ? 'text-indigo-600 font-semibold' : ''}`}
            onClick={() => setView('graph')}
          >
            Graph View
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${showMenu ? 'ml-64' : 'ml-0'} md:ml-64`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-100 shadow">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="md:hidden text-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <FiMenu />
          </button>
          <h1 className=" text-2xl font-semibold  w-full text-center md:text-left md:pl-4 mt-20">
            User Dashboard
          </h1>
        </div>

        {/* Content */}
        <div className="p-6 bg-gray-50 max-w-7xl mx-auto h-[calc(100vh-64px)] overflow-y-auto">
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded shadow mb-6">
              {error}
            </div>
          )}

          {feedback.length > 0 ? (
            view === 'table' ? (
              <div className="w-full overflow-x-auto bg-white shadow-md rounded-lg">
                <table className="w-full text-sm text-gray-700 table-auto">
                  <thead className="bg-gray-100">
                    <tr>
                     
                      <th className="px-6 py-3 text-left">Score</th>
                      <th className="px-6 py-3 text-left">Max Score</th>
                      <th className="px-6 py-3 text-left">Percentage</th>
                      <th className="px-6 py-3 text-left">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedback.map((entry, index) => (
                      <tr key={index} className="border-t hover:bg-gray-50">
                      
                        <td className="px-6 py-4">{entry.totalScore}</td>
                        <td className="px-6 py-4">{entry.maxScore}</td>
                        <td className="px-6 py-4">{entry.percentage}%</td>
                        <td className="px-6 py-4">
                          {entry.timestamp
                            ? new Date(entry.timestamp).toLocaleString()
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Score Overview</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Score" fill="#6366F1" />
                    <Bar dataKey="Max Score" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )
          ) : (
            !error && (
              <p className="text-center text-gray-500">Loading feedback...</p>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
