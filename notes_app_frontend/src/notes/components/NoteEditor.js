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
      // Images: ![alt](url)
      text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
      // Links: [text](url)
      text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      // Bold
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
      // Italics
      text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
      text = text.replace(/_(.*?)_/g, '<em>$1</em>');
      // Inline Code
      text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
      return text;
    };

    const lines = text.split('\n');
    let output = [];
    let inList = false;
    let listType = null;
    let inCodeBlock = false;
    let tableBuffer = [];

    const flushTable = () => {
      if (tableBuffer.length === 0) return;
      
      const rows = tableBuffer.map(row => 
        row.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())
      );
      
      let html = '<div class="table-container"><table>';
      
      // Check for separator line (e.g., |---|---|)
      let separatorIndex = -1;
      for (let i = 0; i < rows.length; i++) {
         const isSeparator = tableBuffer[i].replace(/[|\-\:\s]/g, '') === '';
         if (isSeparator && i > 0) {
             separatorIndex = i;
             break;
         }
      }
      
      if (separatorIndex !== -1) {
          // Header
          html += '<thead><tr>';
          rows[0].forEach(cell => {
              html += `<th>${parseInline(escapeHtml(cell))}</th>`;
          });
          html += '</tr></thead><tbody>';
          
          // Body
          for (let i = 1; i < rows.length; i++) {
              if (i === separatorIndex) continue;
              html += '<tr>';
              rows[i].forEach(cell => {
                  html += `<td>${parseInline(escapeHtml(cell))}</td>`;
              });
              html += '</tr>';
          }
          html += '</tbody>';
      } else {
          // No header detected, treat all as body
          html += '<tbody>';
          rows.forEach(r => {
              html += '<tr>';
              r.forEach(c => html += `<td>${parseInline(escapeHtml(c))}</td>`);
              html += '</tr>';
          });
          html += '</tbody>';
      }
      
      html += '</table></div>';
      output.push(html);
      tableBuffer = [];
    };

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Code Blocks
      if (line.trim().startsWith('```')) {
        flushTable();
        if (inList) { output.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; listType = null; }

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

      // Table Detection (lines starting with |)
      if (line.trim().startsWith('|')) {
        if (inList) { output.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; listType = null; }
        tableBuffer.push(line);
        continue;
      } else {
        flushTable();
      }

      // Horizontal Rule
      if (line.trim() === '---' || line.trim() === '***') {
        if (inList) { output.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; listType = null; }
        output.push('<hr />');
        continue;
      }

      // Lists & Task Lists
      const taskMatch = line.match(/^\s*(-|\d+\.)\s+\[([ xX])\]\s+(.*)/);
      const isUl = /^\s*-\s+(.*)/.test(line);
      const isOl = /^\s*\d+\.\s+(.*)/.test(line);

      if (isUl || isOl) {
        let content, currentType, isTask = false, isChecked = false;

        if (taskMatch) {
            isTask = true;
            isChecked = taskMatch[2].toLowerCase() === 'x';
            content = taskMatch[3];
            currentType = 'ul';
        } else {
            content = line.replace(/^\s*(-|\d+\.)\s+/, '');
            currentType = isUl ? 'ul' : 'ol';
        }

        if (!inList) {
          output.push(`<${currentType}>`);
          inList = true;
          listType = currentType;
        } else if (listType !== currentType) {
          output.push(listType === 'ul' ? '</ul>' : '</ol>');
          output.push(`<${currentType}>`);
          listType = currentType;
        }
        
        if (isTask) {
             const checkbox = `<input type="checkbox" ${isChecked ? 'checked' : ''} onclick="return false;" aria-label="Task item" />`;
             output.push(`<li style="list-style: none; display: flex; align-items: start; gap: 8px;">${checkbox} <span>${parseInline(escapeHtml(content))}</span></li>`);
        } else {
             output.push(`<li>${parseInline(escapeHtml(content))}</li>`);
        }
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

    flushTable();
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
