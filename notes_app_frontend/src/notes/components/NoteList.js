import React from 'react';

/**
 * List of notes with actions.
 */
// PUBLIC_INTERFACE
export function NoteList({
  notes,
  onEdit,
  onDelete,
  onOpen,
  onTogglePinned,
  onToggleFavorite,
  search,
  setSearch,
  sortBy,
  setSortBy,
}) {
  const filtered = notes.filter((n) => {
    const q = (search || '').toLowerCase();
    if (!q) return true;
    return (
      n.title.toLowerCase().includes(q) ||
      (n.content || '').toLowerCase().includes(q) ||
      (n.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <section className="card" aria-label="Notes list">
      <div className="list-header">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
          type="search"
          placeholder="Search notes by title, content, or tag…"
          aria-label="Search notes"
        />
        <div className="sort-control" style={{ display: 'flex', gap: 8 }}>
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
      {filtered.length === 0 ? (
        <div className="empty">
          No notes found. Create your first note or adjust your filters.
        </div>
      ) : (
        <ul className="note-list">
          {filtered.map((note) => (
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
                    note.pinned ? 'Unpin note from top of list' : 'Pin note to top of list'
                  }
                  title={note.pinned ? 'Unpin' : 'Pin'}
                >
                  <span aria-hidden="true">{note.pinned ? '📌' : '📍'}</span>
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
                  <span aria-hidden="true">{note.favorite ? '★' : '☆'}</span>
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
