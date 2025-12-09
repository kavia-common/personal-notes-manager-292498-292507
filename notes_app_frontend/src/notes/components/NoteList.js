import React from 'react';

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
}) {
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

  return (
    <section className="card" aria-label="Notes list">
      <div className="list-header" style={{ flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
          type="search"
          placeholder="Search notes by title, content, or tag…"
          aria-label="Search notes"
        />

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
