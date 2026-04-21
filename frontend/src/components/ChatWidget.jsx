import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendChat } from '../services/api';
import styles from './ChatWidget.module.css';

// ── Clean bot response ──────────────────────────────────────────
function cleanResponse(text) {
  return text
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^\s*[*\-+]\s+/gm, '• ')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\b\w+\.docx\b/g, '')
    .replace(/\b\w+\.pdf\b/g, '')
    .trim();
}


// ── Typing dots ─────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className={styles.msgRow}>
      <div className={styles.avatar}>V</div>
      <div className={`${styles.bubble} ${styles.bot}`}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
}

// ── Single message ───────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === 'user';

  const renderBotContent = (text) => {
    const cleaned = cleanResponse(text);
    const lines = cleaned.split('\n');

    return lines.map((line, i) => {
      const trimmed = line.trim();

      // Empty line — small gap
      if (!trimmed) return <div key={i} style={{ height: '6px' }} />;

      // Section heading — bold dark red
      if (!trimmed.startsWith('•') && trimmed.endsWith(':')) {
        return (
          <div key={i} style={{
            fontWeight: 'bold',
            marginTop: '10px',
            marginBottom: '2px',
            color: '#7a0000',
            fontSize: '15.5px',
          }}>
            {trimmed}
          </div>
        );
      }

      // Bullet point line
      if (trimmed.startsWith('•')) {
        return (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            marginLeft: '8px',
            marginBottom: '2px',
            fontSize: '15.5px',
            lineHeight: '1.5',
          }}>
            <span style={{ color: '#7a0000', fontWeight: 'bold', marginTop: '1px' }}>•</span>
            <span>{trimmed.slice(1).trim()}</span>
          </div>
        );
      }

      // Normal line
      return (
        <div key={i} style={{
          fontSize: '15.5px',
          lineHeight: '1.6',
          marginBottom: '2px',
        }}>
          {trimmed}
        </div>
      );
    });
  };

  return (
    <div className={`${styles.msgRow} ${isUser ? styles.userRow : ''}`}>
      {!isUser && <div className={styles.avatar}>V</div>}
      <div className={`${styles.bubble} ${isUser ? styles.user : styles.bot} ${styles.popIn}`}>
        {isUser ? msg.content : renderBotContent(msg.content)}
      </div>
    </div>
  );
}

// ── Main ChatWidget ──────────────────────────────────────────────
export default function ChatWidget({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'bot', content: '👋 Hi! I\'m Vimala Bot, your college assistant. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Start new chat
  const newChat = useCallback(() => {
    setMessages([{ role: 'bot', content: '🆕 New conversation started! How can I help you?' }]);
    setSessionId(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Send message
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    try {
      const data = await sendChat(text, sessionId);
      if (data.session_id) setSessionId(data.session_id);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: data.response,
        sources: data.sources || [],
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: `⚠️ ${err.message || 'Could not reach the server. Please try again.'}`,
      }]);
    } finally {
      setSending(false);
    }
  }, [input, sending, sessionId]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.window}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <span className={styles.title}>Vimala Bot</span>
        <button className={styles.iconBtn} onClick={onClose} title="Close">✕</button>
      </div>

      {/* ── Body ── */}
      <div className={styles.body}>

        {/* Small sidebar with only + button */}
        <div className={styles.sidebar}>
          <button
            className={styles.newChatBtn}
            onClick={newChat}
            title="New Chat"
          >
            +
          </button>
        </div>

        {/* Chat messages area */}
        <div className={styles.content}>
          <div className={styles.messages}>
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}
            {sending && <TypingDots />}
            <div ref={messagesEndRef} />
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <div className={styles.footer}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          className={styles.input}
          autoComplete="off"
        />
        <button
          className={styles.sendBtn}
          onClick={send}
          disabled={sending || !input.trim()}
          title="Send"
        >
          {sending ? <span className={styles.spinner} /> : '▶'}
        </button>
      </div>

    </div>
  );
}