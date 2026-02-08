import React from "react";
import "./ChatWidget.css";

const Sidebar = ({ setActiveView }) => {
  return (
    <div className="chatbot-sidebar">
      <h4>Chatbot</h4>

      <button onClick={() => setActiveView("new")}>New Chat</button>
      <button onClick={() => setActiveView("recent")}>Recent Chat</button>
      <button onClick={() => setActiveView("faq")}>FAQ</button>
      <button onClick={() => setActiveView("about")}>About</button>
    </div>
  );
};

export default Sidebar;
