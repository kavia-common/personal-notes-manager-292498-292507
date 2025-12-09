import React, { useEffect, useRef, useState } from 'react';

/**
 * Editor form for creating or editing a note.
 */
// PUBLIC_INTERFACE
export function NoteEditor({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [content, setContent] = useState(initial?.content || '');
  const [tags, setTags] = useState((initial?.tags || []).join(', '));
  const [error, setError] = useState('');
  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  function toTags(str) {
    return str
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    onSave({
      title: title.trim(),
      content,
      tags: toTags(tags),
    });
  }

  return (
    <section className="card" aria-label="Note editor">
      <form className="editor" onSubmit={handleSubmit}>
        <label>
          Title
          <input
            ref={titleRef}
            className="input"
            type="text"
            placeholder="Enter a title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'title-error' : undefined}
          />
        </label>
        {error && (
          <div id="title-error" style={{ color: 'var(--color-error)', fontSize: 13 }}>
            {error}
          </div>
        )}
        <label>
          Content
          <textarea
            className="textarea"
            placeholder="Jot down your thoughts…"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </label>
        <label>
          Tags (comma separated)
          <input
            className="input"
            type="text"
            placeholder="work, personal, ideas"
            value={tags}
            onChange={e => setTags(e.target.value)}
          />
        </label>

        <div className="editor-actions">
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save
          </button>
        </div>
      </form>
    </section>
  );
}
