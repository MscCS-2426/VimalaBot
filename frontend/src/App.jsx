import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import FAQ from './pages/FAQ';
import About from './pages/About';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';

function PrivateRoute({ children }) {
  return sessionStorage.getItem('adminLoggedIn') ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<Home />} />
        <Route path="/faq"          element={<FAQ />} />
        <Route path="/about"        element={<About />} />
        <Route path="/admin/login"  element={<AdminLogin />} />
        <Route path="/admin/panel"  element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
