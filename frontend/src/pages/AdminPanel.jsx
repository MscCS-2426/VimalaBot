import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminStatus } from '../services/api';
import OverviewTab from '../components/admin/OverviewTab';
import SessionsTab from '../components/admin/SessionsTab';
import DocumentsTab from '../components/admin/DocumentsTab';
import CollectionsTab from '../components/admin/CollectionsTab';
import styles from './AdminPanel.module.css';

const TABS = [
  { id: 'overview',    label: 'Overview',      icon: '📊' },
  { id: 'sessions',    label: 'Chat Sessions',  icon: '💬' },
  { id: 'documents',   label: 'Documents / RAG',icon: '📄' },
  { id: 'collections', label: 'Collections',    icon: '🗂️' },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [adminName, setAdminName] = useState('admin');
  const navigate = useNavigate();

  useEffect(() => {
    adminStatus()
      .then(d => { if (d.admin) setAdminName(d.admin); })
      .catch(() => {});
  }, []);

  function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminToken');
    navigate('/admin/login');
  }

  return (
    <div className={styles.layout}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <span className={styles.logoText}>Vimala Bot</span>
          <span className={styles.logoSub}>Admin Dashboard</span>
        </div>

        <nav className={styles.nav}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.navItem} ${activeTab === tab.id ? styles.navActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.navIcon}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.adminInfo}>
            <div className={styles.adminAvatar}>{adminName[0]?.toUpperCase()}</div>
            <div>
              <div className={styles.adminName}>{adminName}</div>
              <div className={styles.adminRole}>Administrator</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={logout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div>
            <h1 className={styles.pageTitle}>
              {TABS.find(t => t.id === activeTab)?.icon}{' '}
              {TABS.find(t => t.id === activeTab)?.label}
            </h1>
          </div>
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} /> Live
          </div>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'overview'    && <OverviewTab    onNavigate={setActiveTab} />}
          {activeTab === 'sessions'    && <SessionsTab />}
          {activeTab === 'documents'   && <DocumentsTab />}
          {activeTab === 'collections' && <CollectionsTab />}
        </div>
      </main>
    </div>
  );
}
