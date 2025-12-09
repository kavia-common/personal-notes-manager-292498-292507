import React from 'react';

/**
 * Sidebar shows tags/categories placeholder with basic interactivity.
 */
// PUBLIC_INTERFACE
export function Sidebar({ tags = [], activeTag, onSelectTag }) {
  return (
    <div>
      <h2>Tags</h2>
      <div className="tag-list" role="list" aria-label="Tag list">
        <button
          className="tag"
          onClick={() => onSelectTag(null)}
          aria-pressed={activeTag == null}
        >
          All
        </button>
        {tags.map(tag => (
          <button
            key={tag}
            className="tag"
            onClick={() => onSelectTag(tag)}
            aria-pressed={activeTag === tag}
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );
}
