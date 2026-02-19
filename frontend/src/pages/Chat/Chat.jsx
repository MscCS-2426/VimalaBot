import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "./Chat.css";

const Chat = () => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);   // ✅ MISSING STATE ADDED
  const [sessionId, setSessionId] = useState(null);

  /* ================= CREATE SESSION ================= */
  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await api.chatAPI.createSession();
        setSessionId(res.session_id || res.data?.session_id);
      } catch (err) {
        console.error("Session creation failed", err);
      }
    };
    initSession();
  }, []);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput("");

    // Add user message
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);

    if (!sessionId) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⏳ Session initializing, try again..." },
      ]);
      return;
    }

    try {
      setLoading(true);

      const res = await api.chatAPI.sendMessage({
        message: userText,
        session_id: sessionId,
        collection: "default",
      });

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
    <div className="chat-main">

      {/* CHAT BODY */}
      <div className="chat-body">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}

        {loading && <div className="message bot">⏳ Processing…</div>}
      </div>

      {/* INPUT */}
      <form className="chat-input" onSubmit={sendMessage}>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button type="submit" className="send-btn">
          ▶
        </button>
      </form>
    </div>
  );
};

export default Chat;
