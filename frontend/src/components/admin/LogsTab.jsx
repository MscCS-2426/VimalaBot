import React, { useState, useEffect } from 'react';
import { getLogsData, downloadLogs } from '../../services/api';
import styles from './Tabs.module.css';

export default function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      const data = await getLogsData();
      setLogs(data.logs || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    try {
      await downloadLogs();
    } catch (err) {
      alert('Failed to download logs: ' + err.message);
    }
  }

  if (loading) return <div className={styles.loading}>Loading chat logs...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h2 className={styles.title}>Chat History Logs</h2>
          <p className={styles.subtitle}>View and download all user-assistant interactions.</p>
        </div>
        <button className={styles.primaryBtn} onClick={handleDownload}>
          📥 Download CSV
        </button>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Role</th>
              <th>Message</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="3" className={styles.empty}>No logs found yet.</td>
              </tr>
            ) : (
              logs.map((log, i) => (
                <tr key={i} className={log.Role === 'User' ? styles.userRow : styles.assistantRow}>
                  <td>
                    <span className={`${styles.badge} ${log.Role === 'User' ? styles.userBadge : styles.assistantBadge}`}>
                      {log.Role}
                    </span>
                  </td>
                  <td className={styles.messageCell}>{log.Message}</td>
                  <td className={styles.timeCell}>{new Date(log.Timestamp).toLocaleString()}</td>
                </tr>
              ))
            ).reverse()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
