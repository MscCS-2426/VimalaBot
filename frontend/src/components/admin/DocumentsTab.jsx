import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  uploadDocument, embedText,
  listDocuments, deleteDocument, listCollections,
} from '../../services/api';
import {
  Section, Table, Tag, IconBtn, Spinner,
  ConfirmModal, Toast, Field, Input, Textarea, Select, PrimaryBtn,
} from './AdminUI';
import { useToast } from '../../hooks/useToast';
import styles from './Tabs.module.css';

/* ── Upload zone component ───────────────────────────────── */
function UploadZone({ collection, onDone }) {
  const [dragging, setDragging]     = useState(false);
  const [files, setFiles]           = useState([]);     // queued files
  const [uploading, setUploading]   = useState(false);
  const [results, setResults]       = useState([]);     // {name, status, msg}
  const fileInputRef                = useRef();
  const { toast, showToast, dismiss } = useToast();

  function pickFiles(fileList) {
    const arr = Array.from(fileList).filter(f =>
      /\.(pdf|txt|md|docx|csv)$/i.test(f.name)
    );
    if (!arr.length) { showToast('Only PDF, TXT, MD, DOCX, CSV files are supported.', 'error'); return; }
    setFiles(arr);
    setResults([]);
  }

  async function handleUpload() {
    if (!files.length || uploading) return;
    setUploading(true);
    setResults([]);

    const newResults = [];

    for (const file of files) {
      try {
        const data = await uploadDocument(file, collection);
        const msg = data?.message || data?.filename || `${file.name} processed`;
        newResults.push({ name: file.name, status: 'success', msg: `✅ Uploaded: ${msg}` });
      } catch (err) {
        newResults.push({ name: file.name, status: 'error', msg: `❌ Failed: ${err.message}` });
      }
      // Update incrementally so user sees progress
      setResults([...newResults]);
    }

    setUploading(false);
    setFiles([]);

    const successCount = newResults.filter(r => r.status === 'success').length;
    const failCount    = newResults.filter(r => r.status === 'error').length;

    if (failCount === 0) {
      showToast(`✅ All ${successCount} file(s) uploaded to RAG successfully!`, 'success');
    } else if (successCount === 0) {
      showToast(`❌ All ${failCount} upload(s) failed. Check errors below.`, 'error');
    } else {
      showToast(`⚠️ ${successCount} uploaded, ${failCount} failed.`, 'info');
    }

    onDone(); // refresh documents list
  }

  return (
    <>
      <Toast toast={toast} onDismiss={dismiss} />

      {/* Drop zone */}
      <div
        className={`${styles.dropZone} ${dragging ? styles.dropZoneDrag : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); pickFiles(e.dataTransfer.files); }}
      >
        <div className={styles.dropIcon}>📂</div>
        <p className={styles.dropTitle}>
          {dragging ? 'Drop files here' : 'Click or drag & drop files to upload'}
        </p>
        <p className={styles.dropSub}>Supported: PDF, TXT, MD, DOCX, CSV — uploads to <strong>{collection}</strong> collection</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.docx,.csv"
          style={{ display: 'none' }}
          onChange={e => pickFiles(e.target.files)}
        />
      </div>

      {/* Queued files */}
      {files.length > 0 && (
        <div className={styles.fileQueue}>
          {files.map((f, i) => (
            <div key={i} className={styles.fileRow}>
              <span className={styles.fileIcon}>📄</span>
              <span className={styles.fileName}>{f.name}</span>
              <span className={styles.fileSize}>({(f.size / 1024).toFixed(1)} KB)</span>
              <button
                className={styles.removeFile}
                onClick={e => { e.stopPropagation(); setFiles(fs => fs.filter((_, j) => j !== i)); }}
              >✕</button>
            </div>
          ))}
          <PrimaryBtn onClick={handleUpload} loading={uploading}>
            {uploading ? 'Uploading…' : `Upload ${files.length} file(s) to RAG`}
          </PrimaryBtn>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className={styles.uploadResults}>
          {results.map((r, i) => (
            <div key={i} className={`${styles.uploadResult} ${r.status === 'success' ? styles.resultSuccess : styles.resultError}`}>
              {r.msg}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ── Embed text form ─────────────────────────────────────── */
function EmbedForm({ collection, onDone }) {
  const [content, setContent] = useState('');
  const [source,  setSource]  = useState('');
  const [loading, setLoading] = useState(false);
  const { toast, showToast, dismiss } = useToast();

  async function handleEmbed() {
    if (!content.trim()) { showToast('Please enter some content to embed.', 'error'); return; }
    setLoading(true);
    try {
      await embedText(content.trim(), source.trim() || 'manual-entry', collection);
      showToast('✅ Text embedded into RAG knowledge base successfully!', 'success');
      setContent(''); setSource('');
      onDone();
    } catch (err) {
      showToast(`❌ Embedding failed: ${err.message}`, 'error');
    }
    setLoading(false);
  }

  return (
    <>
      <Toast toast={toast} onDismiss={dismiss} />
      <div className={styles.embedForm}>
        <Field label="Source / Title (optional)">
          <Input
            value={source}
            onChange={e => setSource(e.target.value)}
            placeholder="e.g. admissions-2024, fee-structure"
          />
        </Field>
        <Field label="Content to embed">
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Paste the text you want to add to the knowledge base…"
          />
        </Field>
        <PrimaryBtn onClick={handleEmbed} loading={loading}>
          Embed into RAG →
        </PrimaryBtn>
      </div>
    </>
  );
}

/* ── Main DocumentsTab ───────────────────────────────────── */
export default function DocumentsTab() {
  const [collection, setCollection] = useState('default');
  const [collections, setCollections] = useState([]);
  const [docs, setDocs]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [confirm, setConfirm]       = useState(null); // { id }
  const [activePanel, setActivePanel] = useState('upload'); // 'upload' | 'embed'
  const { toast, showToast, dismiss } = useToast();

  const loadCollections = useCallback(async () => {
    try {
      const data = await listCollections();
      setCollections(data.collections || []);
    } catch { /* ignore */ }
  }, []);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listDocuments(collection);
      setDocs(data.documents || data.results || []);
    } catch (e) {
      showToast('Failed to load documents: ' + e.message, 'error');
      setDocs([]);
    }
    setLoading(false);
  }, [collection, showToast]);

  useEffect(() => { loadCollections(); }, [loadCollections]);
  useEffect(() => { loadDocs(); }, [loadDocs]);

  async function handleDelete() {
    const id = confirm.id;
    setConfirm(null);
    try {
      await deleteDocument(id, collection);
      showToast('✅ Document deleted from RAG.', 'success');
      loadDocs();
    } catch (e) {
      showToast(`❌ Delete failed: ${e.message}`, 'error');
    }
  }

  return (
    <>
      <Toast toast={toast} onDismiss={dismiss} />
      {confirm && (
        <ConfirmModal
          message={`Delete document "${confirm.id.slice(0, 20)}…" from the knowledge base? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Collection selector */}
      <Section title="Active Collection">
        <div className={styles.collRow}>
          <Field label="Collection">
            <Select value={collection} onChange={e => setCollection(e.target.value)} style={{ maxWidth: 260 }}>
              {collections.length === 0
                ? <option value="default">default</option>
                : collections.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.document_count} docs)
                    </option>
                  ))}
            </Select>
          </Field>
          <button className={styles.refreshBtn} onClick={loadDocs} title="Reload">↻ Reload docs</button>
        </div>
      </Section>

      {/* Upload / Embed toggle */}
      <Section
        title="Add to RAG Knowledge Base"
        action={
          <div className={styles.panelToggle}>
            <button
              className={`${styles.toggleBtn} ${activePanel === 'upload' ? styles.toggleActive : ''}`}
              onClick={() => setActivePanel('upload')}
            >
              📤 Upload File
            </button>
            <button
              className={`${styles.toggleBtn} ${activePanel === 'embed' ? styles.toggleActive : ''}`}
              onClick={() => setActivePanel('embed')}
            >
              ✏️ Embed Text
            </button>
          </div>
        }
      >
        {activePanel === 'upload' && (
          <UploadZone collection={collection} onDone={loadDocs} />
        )}
        {activePanel === 'embed' && (
          <EmbedForm collection={collection} onDone={loadDocs} />
        )}
      </Section>

      {/* Documents list */}
      <Section
        title={`Documents in "${collection}" (${docs.length})`}
        action={<button className={styles.refreshBtn} onClick={loadDocs}>↻ Refresh</button>}
      >
        {loading ? (
          <div className={styles.center}><Spinner size={26} /></div>
        ) : (
          <Table
            cols={['ID', 'Source', 'Preview', 'Actions']}
            empty="No documents in this collection yet. Upload files above to get started."
            rows={docs.map(d => {
              const meta    = d.metadata || {};
              const source  = meta.source || meta.filename || '—';
              const preview = (d.document || d.content || '').slice(0, 80);
              return (
                <tr key={d.id}>
                  <td>
                    <code className={styles.code} title={d.id}>
                      {String(d.id).slice(0, 14)}…
                    </code>
                  </td>
                  <td><Tag color="blue">{source.length > 24 ? source.slice(0, 22) + '…' : source}</Tag></td>
                  <td title={d.document || ''} className={styles.preview}>
                    {preview}{preview.length === 80 ? '…' : ''}
                  </td>
                  <td>
                    <IconBtn danger onClick={() => setConfirm({ id: d.id })} title="Delete document">🗑</IconBtn>
                  </td>
                </tr>
              );
            })}
          />
        )}
      </Section>
    </>
  );
}
