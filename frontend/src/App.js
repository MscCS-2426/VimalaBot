import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Home from "./pages/Home/Home";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";

// Chat main + views
import Chat from "./pages/Chat/Chat";
import NewChat from "./pages/ChatViews/NewChat";
import RecentChat from "./pages/ChatViews/RecentChat";
import About from "./pages/ChatViews/About";
import FAQ from "./pages/ChatViews/Faq";

// Layouts & components
import HomeLayout from "./components/HomeLayout";
import Layout from "./components/Layout";
import ChatWidget from "./components/ChatWidget/ChatWidget";

function App() {
  return (
    <Router>
      {/* Floating chatbot – visible on all pages */}
      <ChatWidget />

      <Routes>
        {/* Home page with Navbar + Footer */}
        <Route
          path="/"
          element={
            <HomeLayout>
              <Home />
            </HomeLayout>
          }
        />

        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Chat section with Sidebar (Layout.jsx) */}
        <Route path="/chat" element={<Layout />}>
          <Route index element={<Chat />} />
          <Route path="new" element={<NewChat />} />
          <Route path="recent" element={<RecentChat />} />
          <Route path="about" element={<About />} />
          <Route path="faq" element={<FAQ />} />
        </Route>

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
