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
  search,
  setSearch,
}) {
  const filtered = notes.filter(n => {
    const q = (search || '').toLowerCase();
    if (!q) return true;
    return (
      n.title.toLowerCase().includes(q) ||
      (n.content || '').toLowerCase().includes(q) ||
      (n.tags || []).some(t => t.toLowerCase().includes(q))
    );
  });

  return (
    <section className="card" aria-label="Notes list">
      <div className="list-header">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
          type="search"
          placeholder="Search notes by title, content, or tag…"
          aria-label="Search notes"
        />
      </div>
      {filtered.length === 0 ? (
        <div className="empty">No notes found. Create your first note.</div>
      ) : (
        <ul className="note-list">
          {filtered.map(note => (
            <li key={note.id} className="note-item">
              <div>
                <h3 className="note-title">{note.title}</h3>
                <p className="note-excerpt">
                  {(note.content || '').slice(0, 140) || 'No content'}
                  {note.content && note.content.length > 140 ? '…' : ''}
                </p>
                <div className="note-meta">
                  Updated {new Date(note.updatedAt).toLocaleString()}
                  {note.tags && note.tags.length > 0 && (
                    <> • Tags: {note.tags.map(t => `#${t}`).join(', ')}</>
                  )}
                </div>
              </div>
              <div className="note-actions" role="group" aria-label={`Actions for ${note.title}`}>
                <button className="btn" onClick={() => onOpen(note.id)} aria-label="Open note">
                  Open
                </button>
                <button className="btn" onClick={() => onEdit(note.id)} aria-label="Edit note">
                  Edit
                </button>
                <button
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
