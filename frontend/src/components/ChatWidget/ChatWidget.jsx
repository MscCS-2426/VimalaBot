import React, { useState } from "react";
import Sidebar from "./Sidebar";
import NewChat from "../../pages/ChatViews/NewChat";
import RecentChat from "../../pages/ChatViews/RecentChat";
import Faq from "../../pages/ChatViews/Faq";
import About from "../../pages/ChatViews/About";
import "./ChatWidget.css";

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [activeView, setActiveView] = useState("new");

  const renderView = () => {
    switch (activeView) {
      case "recent":
        return <RecentChat />;
      case "faq":
        return <Faq />;
      case "about":
        return <About />;
      default:
        return <NewChat />;
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button className="chatbot-fab" onClick={() => setOpen(!open)}>
        💬
      </button>

      {open && (
        <div className="chatbot-widget">
          <div className="chatbot-widget-header">
            <span>College Chatbot</span>
            <button className="close-btn" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>

          <div className="chatbot-widget-body">
            <Sidebar setActiveView={setActiveView} />
            <div className="chatbot-content-area">{renderView()}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
