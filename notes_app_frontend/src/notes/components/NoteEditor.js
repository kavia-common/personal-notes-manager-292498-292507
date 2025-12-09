import React, { useEffect, useRef, useState } from 'react';

/**
 * Editor form for creating or editing a note with Markdown support.
 */
// PUBLIC_INTERFACE
export function NoteEditor({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [content, setContent] = useState(initial?.content || '');
  const [tags, setTags] = useState((initial?.tags || []).join(', '));
  const [error, setError] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    if (!isPreview) {
      titleRef.current?.focus();
    }
  }, [isPreview]);

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

  // Lightweight Markdown Parser
  function parseMarkdown(text) {
    if (!text) return '';
    
    const escapeHtml = (str) => str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    const parseInline = (text) => {
      // Bold
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
      // Italics
      text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
      text = text.replace(/_(.*?)_/g, '<em>$1</em>');
      // Inline Code
      text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
      // Links
      text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      return text;
    };

    const lines = text.split('\n');
    let output = [];
    let inList = false;
    let listType = null;
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Code Blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          output.push('</code></pre>');
          inCodeBlock = false;
        } else {
          output.push('<pre><code>');
          inCodeBlock = true;
        }
        continue;
      }
      if (inCodeBlock) {
        output.push(escapeHtml(line));
        continue;
      }

      // Horizontal Rule
      if (line.trim() === '---') {
        if (inList) { output.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; listType = null; }
        output.push('<hr />');
        continue;
      }

      // Lists
      const isUl = /^\s*-\s+(.*)/.test(line);
      const isOl = /^\s*\d+\.\s+(.*)/.test(line);

      if (isUl || isOl) {
        const content = line.replace(/^\s*(-|\d+\.)\s+/, '');
        const currentType = isUl ? 'ul' : 'ol';
        
        if (!inList) {
          output.push(`<${currentType}>`);
          inList = true;
          listType = currentType;
        } else if (listType !== currentType) {
          output.push(listType === 'ul' ? '</ul>' : '</ol>');
          output.push(`<${currentType}>`);
          listType = currentType;
        }
        output.push(`<li>${parseInline(escapeHtml(content))}</li>`);
        continue;
      }
      
      if (inList) {
        output.push(listType === 'ul' ? '</ul>' : '</ol>');
        inList = false;
        listType = null;
      }

      // Headings
      if (line.startsWith('# ')) {
        output.push(`<h1>${parseInline(escapeHtml(line.slice(2)))}</h1>`);
        continue;
      }
      if (line.startsWith('## ')) {
        output.push(`<h2>${parseInline(escapeHtml(line.slice(3)))}</h2>`);
        continue;
      }
      if (line.startsWith('### ')) {
        output.push(`<h3>${parseInline(escapeHtml(line.slice(4)))}</h3>`);
        continue;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        output.push(`<blockquote>${parseInline(escapeHtml(line.slice(2)))}</blockquote>`);
        continue;
      }

      // Empty lines
      if (line.trim() === '') {
        output.push('<br />');
        continue;
      }

      // Paragraphs
      output.push(`<p>${parseInline(escapeHtml(line))}</p>`);
    }

    if (inList) {
      output.push(listType === 'ul' ? '</ul>' : '</ol>');
    }
    if (inCodeBlock) {
      output.push('</code></pre>');
    }

    return output.join('\n');
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
        
        <div role="group" aria-label="Editor mode">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ marginBottom: 4, display: 'block' }}>Content</label>
            <div className="tab-group">
              <button 
                type="button" 
                className={`tab-btn ${!isPreview ? 'active' : ''}`}
                onClick={() => setIsPreview(false)}
                aria-pressed={!isPreview}
              >
                Write
              </button>
              <button 
                type="button" 
                className={`tab-btn ${isPreview ? 'active' : ''}`}
                onClick={() => setIsPreview(true)}
                aria-pressed={isPreview}
              >
                Preview
              </button>
            </div>
          </div>
          
          {isPreview ? (
            <div 
              className="markdown-preview" 
              dangerouslySetInnerHTML={{ __html: parseMarkdown(content) || '<p style="color:var(--muted)">Nothing to preview</p>' }}
              aria-label="Markdown preview"
              tabIndex={0}
            />
          ) : (
            <textarea
              className="textarea"
              placeholder="Jot down your thoughts… (Markdown supported)"
              value={content}
              onChange={e => setContent(e.target.value)}
              aria-label="Content editor"
            />
          )}
        </div>

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
