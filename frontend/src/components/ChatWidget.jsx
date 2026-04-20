import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendChat } from '../services/api';
import styles from './ChatWidget.module.css';

// ADD THIS after your imports
function cleanResponse(text) {
  return text
    .replace(/#{1,6}\s*/g, '')          // removes ### ## #
    .replace(/\*\*(.*?)\*\*/g, '$1')    // removes **bold**
    .replace(/\*(.*?)\*/g, '$1')        // removes *italic*
    .replace(/^\s*[*\-+]\s+/gm, '• ')  // converts * - + list items to bullet •
    .replace(/^\s*\+\s+/gm, '  • ')    // converts + sub-items to indented bullet
    .replace(/`(.*?)`/g, '$1')          // removes `code`
    .replace(/\n{3,}/g, '\n\n')         // removes extra blank lines
    .replace(/\b\w+\.docx\b/g, '')      // removes .docx filenames
    .replace(/\b\w+\.pdf\b/g, '')       // removes .pdf filenames
    .trim();
}

// ── FAQ data shown inside chat widget ──────────────────────────
const FAQ_ITEMS = [
  { q: 'What is Vimala Bot?', a: 'Vimala Bot is an AI-powered assistant for our college, providing instant answers about admissions, courses, fees, and schedules — 24/7.' },
  { q: 'What topics can it help with?', a: 'Admissions & eligibility, Course details & syllabi, Fee structures & scholarships, Exam timetables, Campus facilities, and general college queries.' },
  { q: 'How is it powered?', a: 'It uses RAG (Retrieval-Augmented Generation) — your question is matched against a college knowledge base using vector search, then answered by Llama 4 via Groq.' },
  { q: 'Is my conversation private?', a: 'Yes. Conversations are stored securely and used only to improve accuracy. No personal data is shared with third parties.' },
  { q: 'Available 24/7?', a: 'Absolutely. Vimala Bot is available round the clock, including weekends and public holidays.' },
];

const ABOUT_TEXT = [
  { icon: '🎯', title: 'Our Mission', body: 'Provide every student, parent and faculty member with instant, accurate college information without waiting in queues.' },
  { icon: '🤖', title: 'How It Works', body: 'Your question is matched against our curated knowledge base using vector search (ChromaDB), then answered by an LLM (Llama 4 via Groq).' },
  { icon: '📈', title: 'Always Improving', body: 'Admins continuously upload documents to expand the knowledge base, making the bot smarter over time.' },
  { icon: '🔒', title: 'Secure & Reliable', body: 'Admin access is JWT-protected. The system runs 24/7 with encrypted data storage.' },
];

// ── View constants ──────────────────────────────────────────────
const VIEW = { CHAT: 'chat', FAQ: 'faq', ABOUT: 'about' };

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
      if (!trimmed) return <div key={i} style={{ height: '6px' }} />;

      // Section heading (no bullet, short line ending with nothing or colon)
      if (!trimmed.startsWith('•') && trimmed.endsWith(':')) {
        return (
          <div key={i} style={{
            fontWeight: 'bold',
            marginTop: '10px',
            marginBottom: '2px',
            color: '#7a0000',
            fontSize: '13px',
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
            fontSize: '13px',
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
          fontSize: '13px',
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

// ── FAQ view inside widget ───────────────────────────────────────
function FAQView({ onAsk }) {
  const [open, setOpen] = useState(null);
  return (
    <div className={styles.infoView}>
      <div className={styles.infoHeader}>
        <span className={styles.infoIcon}>❓</span>
        <h3>Frequently Asked Questions</h3>
      </div>
      <div className={styles.faqList}>
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className={`${styles.faqItem} ${open === i ? styles.faqOpen : ''}`}>
            <button className={styles.faqQ} onClick={() => setOpen(open === i ? null : i)}>
              {item.q}
              <span className={styles.faqIcon}>{open === i ? '−' : '+'}</span>
            </button>
            {open === i && (
              <div className={styles.faqA}>
                {item.a}
                <button className={styles.askBtn} onClick={() => onAsk(item.q)}>
                  Ask bot this →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── About view inside widget ─────────────────────────────────────
function AboutView() {
  return (
    <div className={styles.infoView}>
      <div className={styles.infoHeader}>
        <span className={styles.infoIcon}>ℹ️</span>
        <h3>About Vimala Bot</h3>
      </div>
      <p className={styles.aboutIntro}>
        A smart AI assistant built to make college life easier for everyone — students, parents, and faculty.
      </p>
      <div className={styles.aboutCards}>
        {ABOUT_TEXT.map((c, i) => (
          <div key={i} className={styles.aboutCard}>
            <span className={styles.aboutIcon}>{c.icon}</span>
            <div>
              <strong>{c.title}</strong>
              <p>{c.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ChatWidget ──────────────────────────────────────────────
export default function ChatWidget({ isOpen, onClose }) {
  const [view, setView] = useState(VIEW.CHAT);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([
    { role: 'bot', content: '👋 Hi! I\'m Vimala Bot, your college assistant. How can i help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // focus input when chat opens
  useEffect(() => {
    if (isOpen && view === VIEW.CHAT) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, view]);

  const newChat = useCallback(() => {
    setMessages([{ role: 'bot', content: '🆕 New conversation started! How can I help you?' }]);
    setSessionId(null);
    setView(VIEW.CHAT);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // When user clicks "Ask bot this →" from FAQ
  const askFromFAQ = useCallback((question) => {
    setView(VIEW.CHAT);
    setInput(question);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    setView(VIEW.CHAT);
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    try {
      const data = await sendChat(text, sessionId);
      if (data.session_id) setSessionId(data.session_id);
      setMessages(prev => [...prev, { role: 'bot', content: data.response, sources: data.sources || [] }]);
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.window}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <button className={styles.iconBtn} onClick={() => setSidebarOpen(o => !o)} title="Toggle menu">
          ☰
        </button>
        <span className={styles.title}>Vimala Bot</span>
        <button className={styles.iconBtn} onClick={onClose} title="Close">✕</button>
      </div>

      {/* ── Body ── */}
      <div className={styles.body}>
        {/* Sidebar */}
        <div className={`${styles.sidebar} ${sidebarOpen ? '' : styles.sidebarHidden}`}>
          <button
            className={`${styles.sidebarBtn} ${view === VIEW.CHAT ? styles.sidebarActive : ''}`}
            onClick={newChat}
          >
            New Chat
          </button>
          <button
            className={`${styles.sidebarBtn} ${view === VIEW.FAQ ? styles.sidebarActive : ''}`}
            onClick={() => setView(VIEW.FAQ)}
          >
            FAQ
          </button>
          <button
            className={`${styles.sidebarBtn} ${view === VIEW.ABOUT ? styles.sidebarActive : ''}`}
            onClick={() => setView(VIEW.ABOUT)}
          >
            About
          </button>
        </div>

        {/* Content area — switches between chat / faq / about */}
        <div className={styles.content}>
          {view === VIEW.CHAT && (
            <div className={styles.messages}>
              {messages.map((msg, i) => <Message key={i} msg={msg} />)}
              {sending && <TypingDots />}
              <div ref={messagesEndRef} />
            </div>
          )}
          {view === VIEW.FAQ && (
            <div className={styles.scrollable}>
              <FAQView onAsk={askFromFAQ} />
            </div>
          )}
          {view === VIEW.ABOUT && (
            <div className={styles.scrollable}>
              <AboutView />
            </div>
          )}
        </div>
      </div>

      {/* ── Footer (always visible) ── */}
      <div className={styles.footer}>
        <input
          ref={inputRef}
          type="text"
          placeholder={view !== VIEW.CHAT ? 'Switch to chat to ask a question…' : 'Type a message…'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => { if (view !== VIEW.CHAT && input) setView(VIEW.CHAT); }}
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
