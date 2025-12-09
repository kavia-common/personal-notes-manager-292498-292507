import React, { useRef, useState } from 'react';
import { ExportImportUtils } from '../utils/exportImport';

/**
 * List of notes with actions and filter controls.
 */
// PUBLIC_INTERFACE
export function NoteList({
  notes,
  allTags = [],
  selectedTags,
  setSelectedTags,
  favoritesOnly,
  setFavoritesOnly,
  pinnedOnly,
  setPinnedOnly,
  onEdit,
  onDelete,
  onOpen,
  onTogglePinned,
  onToggleFavorite,
  search,
  setSearch,
  sortBy,
  setSortBy,
  allNotes = [], // All notes for JSON export (ignoring filters)
  currentNote = null, // Currently open/selected note for Markdown export
  onRefresh, // Function to refresh notes after import
}) {
  const fileInputRef = useRef(null);
  const [importStatus, setImportStatus] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  function handleTagToggle(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleClearFilters() {
    setSelectedTags([]);
    setFavoritesOnly(false);
    setPinnedOnly(false);
    setSearch('');
  }

  const hasActiveFilters =
    (selectedTags && selectedTags.length > 0) ||
    favoritesOnly ||
    pinnedOnly ||
    (search && search.trim().length > 0);

  // Export/Import handlers
  function handleExportJSON() {
    const result = ExportImportUtils.exportNotesAsJSON(allNotes);
    if (!result.success) {
      setImportStatus({ type: 'error', message: `Export failed: ${result.error}` });
    } else {
      setImportStatus({ type: 'success', message: `Notes exported successfully to ${result.filename}` });
    }
    // Clear status after 5 seconds
    setTimeout(() => setImportStatus(null), 5000);
  }

  function handleExportMarkdown() {
    const notesToExport = currentNote ? [currentNote] : notes;
    if (notesToExport.length === 0) {
      setImportStatus({ type: 'error', message: 'No notes to export' });
      setTimeout(() => setImportStatus(null), 5000);
      return;
    }

    const result = ExportImportUtils.exportNotesAsMarkdown(notesToExport);
    if (!result.success) {
      setImportStatus({ type: 'error', message: `Export failed: ${result.error}` });
    } else {
      const count = notesToExport.length;
      setImportStatus({ 
        type: 'success', 
        message: `${count} note${count > 1 ? 's' : ''} exported successfully to ${result.filename}` 
      });
    }
    // Clear status after 5 seconds
    setTimeout(() => setImportStatus(null), 5000);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      let notesToImport = [];
      
      if (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')) {
        notesToImport = await ExportImportUtils.parseJSONFile(file);
      } else if (file.name.toLowerCase().endsWith('.md')) {
        notesToImport = await ExportImportUtils.parseMarkdownFile(file);
      } else {
        throw new Error('Unsupported file type. Please select a JSON or Markdown file.');
      }

      // Import the notes
      const { NotesService } = await import('../api/NotesService');
      const result = await ExportImportUtils.importNotes(notesToImport, allNotes, NotesService);
      
      if (result.success) {
        const { summary } = result;
        setImportStatus({
          type: 'success',
          message: `Import complete: ${summary.added} notes added, ${summary.updated} updated, ${summary.skipped} skipped`
        });
        
        // Refresh the notes list
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        setImportStatus({ type: 'error', message: `Import failed: ${result.error}` });
      }
    } catch (error) {
      setImportStatus({ type: 'error', message: error.message });
    } finally {
      setIsImporting(false);
      // Clear the file input
      if (event.target) {
        event.target.value = '';
      }
      // Clear status after 8 seconds for import messages
      setTimeout(() => setImportStatus(null), 8000);
    }
  }

  return (
    <section className="card" aria-label="Notes list">
      {/* Import/Export Status Messages */}
      {importStatus && (
        <div
          className={`import-status ${importStatus.type}`}
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            margin: '16px 16px 0 16px',
            fontSize: '14px',
            backgroundColor: importStatus.type === 'success' ? 'var(--surface)' : '#fee',
            color: importStatus.type === 'success' ? 'var(--text)' : '#c53030',
            border: `1px solid ${importStatus.type === 'success' ? 'var(--border)' : '#f87171'}`,
          }}
          role={importStatus.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {importStatus.message}
        </div>
      )}

      <div className="list-header" style={{ flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
          type="search"
          placeholder="Search notes by title, content, or tag…"
          aria-label="Search notes"
        />

        {/* Export/Import Controls */}
        <div
          className="export-import-controls"
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
          aria-label="Export and import controls"
        >
          <button
            type="button"
            className="btn"
            onClick={handleExportJSON}
            aria-label="Export all notes as JSON"
            title="Export all notes as JSON file"
          >
            📄 Export JSON
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleExportMarkdown}
            aria-label={currentNote ? "Export current note as Markdown" : "Export visible notes as Markdown"}
            title={currentNote ? "Export current note as Markdown" : `Export ${notes.length} visible note${notes.length !== 1 ? 's' : ''} as Markdown`}
          >
            📝 Export Markdown
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleImportClick}
            disabled={isImporting}
            aria-label="Import notes from file"
            title="Import notes from JSON or Markdown file"
          >
            {isImporting ? '⏳ Importing...' : '📁 Import'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.md"
            onChange={handleFileImport}
            style={{ display: 'none' }}
            aria-hidden="true"
          />
        </div>

        <div
          className="filter-group"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
          aria-label="Note filters"
        >
          <fieldset
            style={{
              border: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <legend
              style={{
                fontSize: 12,
                color: 'var(--muted)',
              }}
            >
              Flags
            </legend>
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <label
                style={{ fontSize: 13, display: 'inline-flex', gap: 4 }}
              >
                <input
                  type="checkbox"
                  checked={favoritesOnly}
                  onChange={(e) => setFavoritesOnly(e.target.checked)}
                />
                Favorites only
              </label>
              <label
                style={{ fontSize: 13, display: 'inline-flex', gap: 4 }}
              >
                <input
                  type="checkbox"
                  checked={pinnedOnly}
                  onChange={(e) => setPinnedOnly(e.target.checked)}
                />
                Pinned only
              </label>
            </div>
          </fieldset>

          <div
            className="tag-filter"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minWidth: 160,
            }}
          >
            <label
              htmlFor="tag-filter-select"
              style={{ fontSize: 12, color: 'var(--muted)' }}
            >
              Filter by tags
            </label>
            <div
              id="tag-filter-select"
              aria-label="Filter by tags"
              role="group"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              {allTags.length === 0 ? (
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  No tags yet
                </span>
              ) : (
                allTags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      className="tag"
                      onClick={() => handleTagToggle(tag)}
                      aria-pressed={active}
                    >
                      #{tag}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div
          className="sort-control"
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            marginLeft: 'auto',
          }}
        >
          <label
            htmlFor="sort-notes"
            style={{ fontSize: 12, color: 'var(--muted)' }}
          >
            Sort
          </label>
          <select
            id="sort-notes"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input"
            style={{ maxWidth: 200, paddingBlock: 6, paddingInline: 10 }}
            aria-label="Sort notes"
          >
            <option value="pinned">Pinned first (default)</option>
            <option value="updated">Recently updated</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div
          className="active-filters"
          aria-label="Active filters"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            padding: '8px 16px 0 16px',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            Active:
          </span>
          {search && search.trim().length > 0 && (
            <span className="filter-chip">
              Search: “{search.trim()}”
            </span>
          )}
          {favoritesOnly && (
            <span className="filter-chip">Favorites only</span>
          )}
          {pinnedOnly && (
            <span className="filter-chip">Pinned only</span>
          )}
          {selectedTags.map((t) => (
            <button
              key={t}
              type="button"
              className="filter-chip"
              onClick={() => handleTagToggle(t)}
              aria-label={`Remove tag filter ${t}`}
            >
              #{t} ×
            </button>
          ))}
          <button
            type="button"
            className="btn"
            onClick={handleClearFilters}
            style={{ padding: '4px 10px', fontSize: 12, marginLeft: 'auto' }}
          >
            Clear all
          </button>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="empty">
          No notes found. Create your first note or adjust your filters.
        </div>
      ) : (
        <ul className="note-list">
          {notes.map((note) => (
            <li key={note.id} className="note-item">
              <button
                type="button"
                className="note-main"
                onClick={() => onOpen(note.id)}
                style={{
                  textAlign: 'left',
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                }}
                aria-label={`Open note ${note.title}`}
              >
                <h3 className="note-title">
                  {note.title}{' '}
                  {note.pinned && (
                    <span
                      className="note-flag"
                      aria-label="Pinned"
                      title="Pinned"
                    >
                      📌
                    </span>
                  )}
                  {note.favorite && (
                    <span
                      className="note-flag"
                      aria-label="Favorite"
                      title="Favorite"
                      style={{ marginLeft: 4 }}
                    >
                      ★
                    </span>
                  )}
                </h3>
                <p className="note-excerpt">
                  {(note.content || '').slice(0, 140) || 'No content'}
                  {note.content && note.content.length > 140 ? '…' : ''}
                </p>
                <div className="note-meta">
                  Updated {new Date(note.updatedAt).toLocaleString()}
                  {note.tags && note.tags.length > 0 && (
                    <> • Tags: {note.tags.map((t) => `#${t}`).join(', ')}</>
                  )}
                </div>
              </button>
              <div
                className="note-actions"
                role="group"
                aria-label={`Actions for ${note.title}`}
              >
                <button
                  type="button"
                  className="btn btn-icon"
                  onClick={() => onTogglePinned(note.id)}
                  aria-pressed={note.pinned}
                  aria-label={
                    note.pinned
                      ? 'Unpin note from top of list'
                      : 'Pin note to top of list'
                  }
                  title={note.pinned ? 'Unpin' : 'Pin'}
                >
                  <span aria-hidden="true">
                    {note.pinned ? '📌' : '📍'}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn btn-icon"
                  onClick={() => onToggleFavorite(note.id)}
                  aria-pressed={note.favorite}
                  aria-label={
                    note.favorite
                      ? 'Remove note from favorites'
                      : 'Mark note as favorite'
                  }
                  title={note.favorite ? 'Unfavorite' : 'Favorite'}
                >
                  <span aria-hidden="true">
                    {note.favorite ? '★' : '☆'}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => onEdit(note.id)}
                  aria-label="Edit note"
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => onDelete(note.id)}
                  aria-label="Delete note"
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
