import React, { useEffect, useState, useCallback } from 'react';
import { listSessions, deleteSession, getChatHistory } from '../../services/api';
import { Section, Table, Tag, IconBtn, Spinner, ConfirmModal, Toast } from './AdminUI';
import { useToast } from '../../hooks/useToast';
import styles from './Tabs.module.css';

function HistoryModal({ session, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChatHistory(session.session_id)
      .then(d => setHistory(d.history || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [session]);

  return (
    <div className={styles.overlay}>
      <div className={styles.historyModal}>
        <div className={styles.historyHeader}>
          <div>
            <h3>Chat History</h3>
            <code className={styles.code}>{session.session_id}</code>
          </div>
          <button className={styles.closeModalBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.historyBody}>
          {loading ? (
            <div className={styles.center}><Spinner size={24} /></div>
          ) : history.length === 0 ? (
            <p className={styles.empty}>No messages in this session.</p>
          ) : (
            history.map((msg, i) => (
              <div key={i} className={`${styles.histMsg} ${msg.role === 'user' ? styles.histUser : styles.histBot}`}>
                <span className={styles.histRole}>{msg.role === 'user' ? '👤 User' : '🤖 Bot'}</span>
                <p>{msg.content || msg.message || JSON.stringify(msg)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function SessionsTab() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [confirm, setConfirm]   = useState(null); // session_id to delete
  const [viewSession, setViewSession] = useState(null);
  const { toast, showToast, dismiss } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listSessions();
      setSessions(data.sessions || []);
    } catch (e) {
      showToast('Failed to load sessions: ' + e.message, 'error');
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    const id = confirm;
    setConfirm(null);
    try {
      await deleteSession(id);
      showToast('Session deleted successfully.', 'success');
      load();
    } catch (e) {
      showToast('Failed to delete session: ' + e.message, 'error');
    }
  }

  return (
    <>
      <Toast toast={toast} onDismiss={dismiss} />
      {confirm && (
        <ConfirmModal
          message={`Delete session "${confirm.slice(0, 20)}…"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
      {viewSession && <HistoryModal session={viewSession} onClose={() => setViewSession(null)} />}

      <Section
        title={`All Chat Sessions (${sessions.length})`}
        action={
          <button className={styles.refreshBtn} onClick={load} title="Refresh">↻ Refresh</button>
        }
      >
        {loading ? (
          <div className={styles.center}><Spinner size={26} /></div>
        ) : (
          <Table
            cols={['Session ID', 'Messages', 'Created', 'Last Active', 'Actions']}
            empty="No chat sessions yet."
            rows={sessions.map(s => (
              <tr key={s.session_id}>
                <td>
                  <code className={styles.code} title={s.session_id}>
                    {s.session_id.slice(0, 18)}…
                  </code>
                </td>
                <td><Tag color="blue">{s.message_count ?? 0} msgs</Tag></td>
                <td>{s.created_at ? new Date(s.created_at).toLocaleString() : '—'}</td>
                <td>{s.last_activity ? new Date(s.last_activity).toLocaleString() : '—'}</td>
                <td>
                  <div className={styles.actionBtns}>
                    <IconBtn onClick={() => setViewSession(s)} title="View history">👁</IconBtn>
                    <IconBtn danger onClick={() => setConfirm(s.session_id)} title="Delete session">🗑</IconBtn>
                  </div>
                </td>
              </tr>
            ))}
          />
        )}
      </Section>
    </>
  );
}
