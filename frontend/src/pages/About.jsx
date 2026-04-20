import React from 'react';
import Navbar from '../components/Navbar';
import styles from './InfoPage.module.css';

const CARDS = [
  { icon: '🎯', title: 'Our Mission', body: 'Provide every student, parent, and faculty member with instant, accurate college information without waiting in queues or navigating complex websites.' },
  { icon: '🤖', title: 'How It Works', body: 'Vimala Bot uses RAG (Retrieval-Augmented Generation). Your question is matched against the college knowledge base via ChromaDB vector search, then answered by Llama 4 (Groq).' },
  { icon: '📈', title: 'Always Improving', body: 'Admins continuously upload documents and embed new knowledge through the dashboard. The bot grows smarter as more content is added.' },
  { icon: '🔒', title: 'Secure & Reliable', body: 'Admin access is protected by JWT authentication. All data is encrypted, and the system is monitored for 24/7 uptime.' },
];

export default function About() {
  return (
    <>
      <Navbar />
      <div className={styles.wrapper}>
        <h1 className={styles.title}>About<br />Vimala Bot</h1>
        <p className={styles.subtitle}>A smart AI assistant built to make college life easier for everyone.</p>

        <div className={styles.introCard}>
          <h2>Built for Our College Community</h2>
          <p>
            Vimala Bot bridges the gap between students and college administration.
            Whether you're a prospective student exploring courses, a current student with fee queries,
            or a parent wanting quick answers — Vimala Bot is here 24/7.
            Powered by Retrieval-Augmented Generation (RAG), it searches a curated knowledge base
            and delivers accurate, contextual answers in seconds.
          </p>
        </div>

        <div className={styles.grid}>
          {CARDS.map((c) => (
            <div key={c.title} className={styles.card}>
              <div className={styles.cardIcon}>{c.icon}</div>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
