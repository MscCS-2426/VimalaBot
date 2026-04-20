import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminLogin } from '../services/api';
import styles from './AdminLogin.module.css';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    if (!username || !password) { setError('Please enter both username and password.'); return; }
    setLoading(true); setError('');
    try {
      const data = await adminLogin(username, password);
      sessionStorage.setItem('adminToken', data.access_token);
      sessionStorage.setItem('adminLoggedIn', 'true');
      navigate('/admin/panel');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>Vimala Bot</div>
        <h2>Admin Login</h2>
        <p className={styles.sub}>Sign in to manage the chatbot dashboard</p>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.field}>
            <label>Username</label>
            <input
              type="text" value={username} autoComplete="username"
              placeholder="Enter admin username"
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input
              type="password" value={password} autoComplete="current-password"
              placeholder="Enter password"
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p className={styles.back}><Link to="/">← Back to Home</Link></p>
      </div>
    </div>
  );
}
