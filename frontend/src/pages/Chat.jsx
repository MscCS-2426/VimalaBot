import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { chatAPI, documentAPI } from "../services/api";
import "./Chat.css";

const Chat = () => {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [sessionId, setSessionId] = useState(null);
  const [collectionName] = useState("default");

  const [messages, setMessages] = useState([
    { sender: "bot", text: "Upload a document and ask questions from it." },
  ]);

  /* ================= CREATE SESSION ================= */
  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await chatAPI.createSession();
        setSessionId(res.session_id);
      } catch (err) {
        console.error("Session creation failed", err);
      }
    };
    initSession();
  }, []);

  /* ================= DOCUMENT UPLOAD ================= */
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: `📄 ${file.name} uploaded` },
    ]);

    try {
      setLoading(true);
      await documentAPI.uploadDocument(file, collectionName);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Document indexed successfully." },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "❌ Document upload failed." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= SEND MESSAGE (RAG) ================= */
  const sendMessage = async (e) => {
  e.preventDefault();
  if (!input.trim()) return;

  const userText = input;
  setInput("");

  // show user message immediately
  setMessages((prev) => [...prev, { sender: "user", text: userText }]);

  // if session not ready, stop here safely
  if (!sessionId) {
    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: "⏳ Initializing session, please try again..." },
    ]);
    return;
  }

  try {
    setLoading(true);
    const res = await chatAPI.sendMessage(
      userText,
      sessionId,
      collectionName
    );

    setMessages((prev) => [
      ...prev,
      {
        sender: "bot",
        text: res.answer || res.response || "No response",
      },
    ]);
  } catch (err) {
    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: "❌ Error getting response." },
    ]);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="chat-page">
      {/* SIDEBAR */}
      <aside className={`chat-sidebar ${sidebarOpen ? "" : "closed"}`}>
        <h3>Chatbot</h3>
        <button
          onClick={() =>
            setMessages([
              { sender: "bot", text: "New chat started. Upload a document." },
            ])
          }
        >
          New Chat
        </button>
        <button onClick={() => navigate("/recentchat")}>Recent Chat</button>
        <button onClick={() => navigate("/faq")}>FAQ</button>
        <button onClick={() => navigate("/about")}>About</button>
      </aside>

      {/* MAIN CHAT */}
      <div className={`chat-main ${sidebarOpen ? "" : "full"}`}>
        <div className="chat-header">
          <button
            className="menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <span>College Chatbot</span>
        </div>

        <div className="chat-body">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
          {loading && <div className="message bot">⏳ Processing…</div>}
        </div>

        <form className="chat-input" onSubmit={sendMessage}>
  {/* Upload */}
  <label className="upload-btn">
    +
    <input
      type="file"
      hidden
      accept=".pdf,.doc,.docx,.txt"
      onChange={handleFileUpload}
    />
  </label>

  {/* Message input */}
  <input
    type="text"
    placeholder="Type a message..."
    value={input}
    onChange={(e) => setInput(e.target.value)}
  />

  {/* Send */}
  <button type="submit" className="send-btn">
    ▶
  </button>
</form>

      </div>
    </div>
  );
};

export default Chat;
