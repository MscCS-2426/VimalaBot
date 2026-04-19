import React, { useEffect, useState, useCallback } from 'react';
import { listSessions, listDocuments, listCollections } from '../../services/api';
import { StatCard, Section, Table, Tag, Spinner } from './AdminUI';
import styles from './Tabs.module.css';

export default function OverviewTab({ onNavigate }) {
  const [stats, setStats] = useState({ sessions: 0, docs: 0, collections: 0 });
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sesData, docData, colData] = await Promise.allSettled([
        listSessions(),
        listDocuments('default', 100),
        listCollections(),
      ]);

      const sessions = sesData.status === 'fulfilled' ? sesData.value.sessions || [] : [];
      const docs     = docData.status === 'fulfilled' ? (docData.value.documents || docData.value.results || []) : [];
      const cols     = colData.status === 'fulfilled' ? (colData.value.collections || []) : [];

      setStats({ sessions: sessions.length, docs: docs.length, collections: cols.length });
      setRecentSessions(sessions.slice(0, 6));
    } catch { /* keep empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {/* Stat row */}
      <div className={styles.statsGrid}>
        <StatCard icon="💬" value={loading ? '…' : stats.sessions}    label="Total Sessions" />
        <StatCard icon="📄" value={loading ? '…' : stats.docs}        label="Documents (default)" />
        <StatCard icon="🗂️" value={loading ? '…' : stats.collections} label="Collections" />
        <StatCard icon="🤖" value="24/7"                               label="Bot Uptime" />
      </div>

      {/* Recent sessions */}
      <Section
        title="Recent Chat Sessions"
        action={
          <>
            <button className={styles.linkBtn} onClick={() => onNavigate('sessions')}>View all →</button>
            <button className={styles.refreshBtn} onClick={load} title="Refresh">↻</button>
          </>
        }
      >
        {loading ? (
          <div className={styles.center}><Spinner size={24} style={{ borderTopColor: 'var(--crimson)', borderColor: 'var(--border)' }} /></div>
        ) : (
          <Table
            cols={['Session ID', 'Messages', 'Created', 'Last Active']}
            empty="No sessions yet. Start chatting to see sessions here."
            rows={recentSessions.map(s => (
              <tr key={s.session_id}>
                <td>
                  <code className={styles.code} title={s.session_id}>
                    {s.session_id.slice(0, 16)}…
                  </code>
                </td>
                <td><Tag color="blue">{s.message_count ?? 0}</Tag></td>
                <td>{s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}</td>
                <td>{s.last_activity ? new Date(s.last_activity).toLocaleString() : '—'}</td>
              </tr>
            ))}
          />
        )}
      </Section>

      {/* Quick links */}
      <div className={styles.quickLinks}>
        <button className={styles.quickCard} onClick={() => onNavigate('documents')}>
          <span className={styles.quickIcon}>📤</span>
          <span className={styles.quickLabel}>Upload Document to RAG</span>
          <span className={styles.quickArrow}>→</span>
        </button>
        <button className={styles.quickCard} onClick={() => onNavigate('collections')}>
          <span className={styles.quickIcon}>🗂️</span>
          <span className={styles.quickLabel}>Manage Collections</span>
          <span className={styles.quickArrow}>→</span>
        </button>
        <button className={styles.quickCard} onClick={() => onNavigate('sessions')}>
          <span className={styles.quickIcon}>💬</span>
          <span className={styles.quickLabel}>View All Sessions</span>
          <span className={styles.quickArrow}>→</span>
        </button>
      </div>
    </div>
  );
}
