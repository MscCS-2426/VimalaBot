import React, { useEffect, useState, useCallback } from 'react';
import { listCollections, createCollection } from '../../services/api';
import { Section, Table, Tag, Spinner, Toast, Field, Input, PrimaryBtn } from './AdminUI';
import { useToast } from '../../hooks/useToast';
import styles from './Tabs.module.css';

export default function CollectionsTab() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [newName, setNewName]         = useState('');
  const [creating, setCreating]       = useState(false);
  const { toast, showToast, dismiss } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCollections();
      setCollections(data.collections || []);
    } catch (e) {
      showToast('Failed to load collections: ' + e.message, 'error');
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) { showToast('Please enter a collection name.', 'error'); return; }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      showToast('Collection name may only contain letters, numbers, _ and -.', 'error');
      return;
    }
    setCreating(true);
    try {
      await createCollection(name);
      showToast(`✅ Collection "${name}" created successfully!`, 'success');
      setNewName('');
      load();
    } catch (e) {
      showToast(`❌ Failed to create collection: ${e.message}`, 'error');
    }
    setCreating(false);
  }

  const totalDocs = collections.reduce((sum, c) => sum + (c.document_count || 0), 0);

  return (
    <>
      <Toast toast={toast} onDismiss={dismiss} />

      {/* Summary row */}
      <div className={styles.collSummary}>
        <div className={styles.collSumCard}>
          <span className={styles.collSumNum}>{collections.length}</span>
          <span className={styles.collSumLabel}>Collections</span>
        </div>
        <div className={styles.collSumCard}>
          <span className={styles.collSumNum}>{totalDocs}</span>
          <span className={styles.collSumLabel}>Total Documents</span>
        </div>
      </div>

      {/* Create new */}
      <Section title="Create New Collection">
        <div className={styles.createRow}>
          <Field label="Collection Name">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. admissions-2025"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              style={{ maxWidth: 300 }}
            />
          </Field>
          <PrimaryBtn onClick={handleCreate} loading={creating} style={{ alignSelf: 'flex-end' }}>
            + Create Collection
          </PrimaryBtn>
        </div>
        <p className={styles.hint}>Name must use only letters, numbers, hyphens, and underscores.</p>
      </Section>

      {/* Collections list */}
      <Section
        title="All Collections"
        action={<button className={styles.refreshBtn} onClick={load}>↻ Refresh</button>}
      >
        {loading ? (
          <div className={styles.center}><Spinner size={26} /></div>
        ) : (
          <Table
            cols={['Name', 'Documents', 'Collection ID', 'Status']}
            empty="No collections found. Create one above."
            rows={collections.map(c => (
              <tr key={c.name}>
                <td><strong>{c.name}</strong></td>
                <td><Tag color={c.document_count > 0 ? 'green' : 'yellow'}>{c.document_count} docs</Tag></td>
                <td>
                  <code className={styles.code} title={c.id}>
                    {String(c.id).slice(0, 16)}…
                  </code>
                </td>
                <td><Tag color="green">Active</Tag></td>
              </tr>
            ))}
          />
        )}
      </Section>
    </>
  );
}
