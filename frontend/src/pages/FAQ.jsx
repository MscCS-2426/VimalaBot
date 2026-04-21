import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import styles from './InfoPage.module.css';

const FAQS = [
  { q: 'What is Vimala Bot?', a: 'Vimala Bot is an AI-powered virtual assistant for our college, providing instant answers about admissions, courses, fee structures, schedules, and more — available 24/7.' },
  { q: 'How do I start chatting?', a: 'Click "Start Chat" on the homepage or the floating chat icon. Type your question and Vimala Bot responds in seconds.' },
  { q: 'What topics can Vimala Bot help with?', a: 'Admissions & eligibility, Course details & syllabi, Fee structures & scholarships, Exam timetables & results, Campus facilities, and general college queries.' },
  { q: 'Is Vimala Bot available outside college hours?', a: 'Yes — Vimala Bot is available 24 hours a day, 7 days a week, including weekends and public holidays.' },
  { q: 'Is my conversation private?', a: 'Conversations are stored securely and used only to improve the bot\'s accuracy. No personal data is shared with third parties.' },
  { q: 'What if Vimala Bot cannot answer my question?', a: 'The bot will suggest contacting the relevant college department directly. You can also visit the admin office or email the administration for complex queries.' },
  { q: 'How do I access the Admin Dashboard?', a: 'Click "Dashboard" in the navigation bar and sign in with your admin credentials. Contact the IT department if you need an account.' },
  { q: 'What AI technology powers Vimala Bot?', a: 'Vimala Bot uses Retrieval-Augmented Generation (RAG) — it searches a curated college knowledge base using ChromaDB vector search and generates accurate answers via Llama 4 through Groq.' },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <>
      <Navbar />
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Frequently Asked<br />Questions</h1>
        <p className={styles.subtitle}>Everything you need to know about Vimala Bot and our college services.</p>

        <div className={styles.faqList}>
          {FAQS.map((item, i) => (
            <div key={i} className={`${styles.faqItem} ${open === i ? styles.open : ''}`}>
              <button className={styles.faqQ} onClick={() => setOpen(open === i ? null : i)}>
                {item.q}
                <span className={styles.faqIcon}>{open === i ? '−' : '+'}</span>
              </button>
              <div className={styles.faqA}>{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
