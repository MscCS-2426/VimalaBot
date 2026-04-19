import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import ChatWidget from '../components/ChatWidget';
import styles from './Home.module.css';

const FEATURES = [
  { icon: '🎓', title: 'Admissions', desc: 'Instant answers on procedures, eligibility, and deadlines.' },
  { icon: '📚', title: 'Courses', desc: 'Explore departments, syllabi, and available programs.' },
  { icon: '💰', title: 'Fee Details', desc: 'Fee structures, scholarships, and payment options.' },
  { icon: '📅', title: 'Schedules', desc: 'Academic calendars, exams, and holiday schedules.' },
];

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <Navbar onStartChat={() => setChatOpen(true)} />

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>🎓 College AI Assistant</span>
          <h1>
            Smart Virtual<br />Assistance for<br /><em>Your College</em>
          </h1>
          <p>
            Our College Chatbot provides instant response for admissions,
            courses, fee details, academic schedules, more.
            Available 24/7 for students
          </p>
          <button className={styles.ctaBtn} onClick={() => setChatOpen(true)}>
            Start Chat <span>→</span>
          </button>
          <div className={styles.stats}>
            <div className={styles.stat}><strong>24/7</strong><span>Available</span></div>
            <div className={styles.statDiv} />
            <div className={styles.stat}><strong>Instant</strong><span>Responses</span></div>
            <div className={styles.statDiv} />
            <div className={styles.stat}><strong>Smart</strong><span>AI Powered</span></div>
          </div>
        </div>

        

        {/* Background orbs */}
        <div className={styles.orb1} />
        <div className={styles.orb2} />
      </section>

      {/* ── Features ── */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>What I Can Help You With</h2>
        <div className={styles.grid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.card}>
              <div className={styles.cardIcon}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Chat widget ── */}
      <ChatWidget isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Floating bubble when chat closed */}
      {!chatOpen && (
        <button className={styles.bubble} onClick={() => setChatOpen(true)} title="Open chat">
          💬
        </button>
      )}
    </>
  );
}
