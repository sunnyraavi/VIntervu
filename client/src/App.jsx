import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import './App.css';
import Interview from './components/Interview';
import ResumeUpload from './components/ResumeUpload';
import Feedback from './Feedback';
import Header from "./components/Header";
import Home from './components/Home';
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import Analyze from "./components/ResumeAnalyzer";
import ResumeEnhancer from "./components/ResumeEnhancer";


const AppWrapper = () => {
  const location = useLocation();
  const hideHeaderRoutes = ['/interview'];

  return (
    <>
      {!hideHeaderRoutes.includes(location.pathname) && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/resume-upload" element={<ResumeUpload />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/enhance" element={<ResumeEnhancer />} />

       
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
