import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';

export default function Navbar({ onStartChat }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 18);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.logo}>Vimala Bot</div>

        <ul className={styles.links}>
          <li><NavLink to="/"      className={({isActive}) => isActive ? styles.active : ''}>Home</NavLink></li>
          <li><NavLink to="/faq"   className={({isActive}) => isActive ? styles.active : ''}>FAQ</NavLink></li>
          <li><NavLink to="/about" className={({isActive}) => isActive ? styles.active : ''}>About</NavLink></li>
          <li><NavLink to="/admin/login" className={({isActive}) => isActive ? styles.active : ''}>Dashboard</NavLink></li>
        </ul>

        <button className={styles.cta} onClick={onStartChat || (() => navigate('/'))}>
          Start Chat
        </button>

        <button className={styles.hamburger} onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          <NavLink to="/"      onClick={() => setMenuOpen(false)}>Home</NavLink>
          <NavLink to="/faq"   onClick={() => setMenuOpen(false)}>FAQ</NavLink>
          <NavLink to="/about" onClick={() => setMenuOpen(false)}>About</NavLink>
          <NavLink to="/admin/login" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
          <button className={styles.cta} onClick={() => { onStartChat?.(); setMenuOpen(false); }}>
            Start Chat
          </button>
        </div>
      )}
    </>
  );
}
