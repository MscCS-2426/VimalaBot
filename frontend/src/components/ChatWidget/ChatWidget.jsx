import React, { useState } from "react";
import Sidebar from "./Sidebar";
import NewChat from "../../pages/ChatViews/NewChat";
import Faq from "../../pages/ChatViews/Faq";
import About from "../../pages/ChatViews/About";
import "./ChatWidget.css";

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [activeView, setActiveView] = useState("new");
  const [sidebarOpen, setSidebarOpen] = useState(true); // NEW

  const renderView = () => {
    switch (activeView) {
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
          
          {/* Header */}
          <div className="chatbot-widget-header">
            
            {/* ☰ Sidebar Toggle */}
            <button
              className="menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>

            <span>Vimala Bot</span>

            <button
              className="close-btn"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="chatbot-widget-body">

            {/* Sidebar (toggle controlled) */}
            {sidebarOpen && (
              <div className="chatbot-sidebar">
                <Sidebar setActiveView={setActiveView} />
              </div>
            )}

            {/* Content */}
            <div className="chatbot-content-area">
              {renderView()}
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
