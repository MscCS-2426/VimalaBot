// src/components/admin/AdminUI.jsx
// Shared primitives used by all admin tabs
import React, { useEffect } from 'react';
import styles from './AdminUI.module.css';

/* ── Stat card ─────────────────────────────────── */
export function StatCard({ icon, value, label, color = 'crimson' }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: color === 'crimson' ? 'var(--crimson-soft)' : `rgba(${color},0.1)` }}>
        {icon}
      </div>
      <div>
        <div className={styles.statValue}>{value ?? '—'}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}

/* ── Section card ──────────────────────────────── */
export function Section({ title, action, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>{title}</span>
        {action && <div className={styles.sectionAction}>{action}</div>}
      </div>
      {children}
    </div>
  );
}

/* ── Table ─────────────────────────────────────── */
export function Table({ cols, rows, empty = 'No data yet.' }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>{cols.map(c => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={cols.length} className={styles.empty}>{empty}</td></tr>
            : rows}
        </tbody>
      </table>
    </div>
  );
}

/* ── Tag / badge ───────────────────────────────── */
export function Tag({ children, color = 'green' }) {
  const map = { green: styles.tagGreen, red: styles.tagRed, yellow: styles.tagYellow, blue: styles.tagBlue };
  return <span className={`${styles.tag} ${map[color] || ''}`}>{children}</span>;
}

/* ── Icon button ───────────────────────────────── */
export function IconBtn({ children, onClick, title, danger }) {
  return (
    <button
      className={`${styles.iconBtn} ${danger ? styles.iconBtnDanger : ''}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

/* ── Spinner ───────────────────────────────────── */
export function Spinner({ size = 20 }) {
  return <span className={styles.spinner} style={{ width: size, height: size }} />;
}

/* ── Toast notification ────────────────────────── */
export function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 4200);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;
  return (
    <div className={`${styles.toast} ${styles['toast_' + toast.type]}`}>
      <span className={styles.toastIcon}>
        {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
      </span>
      <span>{toast.message}</span>
      <button className={styles.toastClose} onClick={onDismiss}>✕</button>
    </div>
  );
}

/* ── Confirm modal ─────────────────────────────── */
export function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <p className={styles.modalMsg}>{message}</p>
        <div className={styles.modalBtns}>
          <button className={styles.modalCancel} onClick={onCancel}>Cancel</button>
          <button className={styles.modalConfirm} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── Form field ────────────────────────────────── */
export function Field({ label, children }) {
  return (
    <div className={styles.field}>
      {label && <label className={styles.fieldLabel}>{label}</label>}
      {children}
    </div>
  );
}

export function Input({ ...props }) {
  return <input className={styles.input} {...props} />;
}

export function Textarea({ ...props }) {
  return <textarea className={styles.textarea} {...props} />;
}

export function Select({ children, ...props }) {
  return <select className={styles.select} {...props}>{children}</select>;
}

export function PrimaryBtn({ children, loading, disabled, ...props }) {
  return (
    <button className={styles.primaryBtn} disabled={loading || disabled} {...props}>
      {loading ? <Spinner size={15} /> : children}
    </button>
  );
}
