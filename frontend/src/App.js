import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Chat from "./pages/Chat";
import About from "./pages/About";
import RecentChat from "./pages/RecentChat";
import FAQ from "./pages/Faq";

import HomeLayout from "./components/HomeLayout";
import ChatWidget from "./components/ChatWidget"; // ✅ from Jumna

function App() {
  return (
    <Router>
      <>
        {/* Floating Chatbot Widget – appears on all pages */}
        <ChatWidget />

        <Routes>
          {/* Home WITH header & footer */}
          <Route
            path="/"
            element={
              <HomeLayout>
                <Home />
              </HomeLayout>
            }
          />

          {/* Pages WITHOUT header & footer */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/about" element={<About />} />
          <Route path="/recentchat" element={<RecentChat />} />
          <Route path="/faq" element={<FAQ />} />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    </Router>
  );
}

export default App;