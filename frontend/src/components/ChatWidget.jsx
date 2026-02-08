import React, { useState } from "react";
import Chat from "../pages/Chat";
import "./ChatWidget.css";

const ChatWidget = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button className="chatbot-fab" onClick={() => setOpen(!open)}>
        💬
      </button>

      {/* Chat Container */}
      {open && (
        <div className="chatbot-widget">
          <div className="chatbot-widget-header">
            <span>College Chatbot</span>
            <button className="close-btn" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>

          <div className="chatbot-widget-body">
            <Chat />
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;