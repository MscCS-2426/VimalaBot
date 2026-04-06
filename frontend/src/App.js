import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Chatbot from './components/Chatbot';
import Dashboard from './components/Dashboard';
import Login from './components/Login'; // ✅ ADD THIS
import './App.css';

function App() {
  const token = localStorage.getItem("token"); // ✅ ADD THIS

  return (
    <Router>
      <div className="app">

        {/* ✅ IF NOT LOGGED IN → SHOW LOGIN */}
        {!token ? (
          <Login />
        ) : (
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/chat" replace />} />
              <Route path="/chat" element={<Chatbot />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </Layout>
        )}

      </div>
    </Router>
  );
}

export default App;