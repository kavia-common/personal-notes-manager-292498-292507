import React, { useEffect, useRef, useState } from 'react';

/**
 * Editor form for creating or editing a note with Markdown support.
 */
// PUBLIC_INTERFACE
export function NoteEditor({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [content, setContent] = useState(initial?.content || '');
  const [tags, setTags] = useState((initial?.tags || []).join(', '));
  const [pinned, setPinned] = useState(
    typeof initial?.pinned === 'boolean' ? initial.pinned : false
  );
  const [favorite, setFavorite] = useState(
    typeof initial?.favorite === 'boolean' ? initial.favorite : false
  );
  const [error, setError] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const titleRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isPreview) {
      titleRef.current?.focus();
    }
  }, [isPreview]);

  // Insert text at the textarea's cursor position.
  function insertTextAtCursor(text) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newContent =
      content.substring(0, start) + text + content.substring(end);
    setContent(newContent);

    // Set cursor position after the inserted text.
    // Use a timeout to ensure the DOM has updated.
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 0);
  }

  // Process an image file to a data URL and insert it into the editor.
  function processImageFile(file, altText = 'image') {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const markdown = `![${altText}](${dataUrl})`;
        insertTextAtCursor(markdown);
      };
      reader.readAsDataURL(file);
      return true;
    }
    return false;
  }

  // Trigger the hidden file input.
  function handleImageButtonClick() {
    fileInputRef.current?.click();
  }

  // Handle file selection from the file input.
  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      processImageFile(file, file.name);
    }
    // Clear the input value so the same file can be selected again.
    if (event.target) {
      event.target.value = '';
    }
  }

  // Handle pasting content, specifically looking for images.
  function handlePaste(event) {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          if (processImageFile(file, 'pasted-image')) {
            // Prevent the default paste action if an image was handled.
            event.preventDefault();
            break; // Handle only the first image.
          }
        }
      }
    }
  }

  // When a task checkbox in the preview is clicked, update the raw markdown.
  function handlePreviewClick(e) {
    const target = e.target;
    if (
      target.tagName === 'INPUT' &&
      target.type === 'checkbox' &&
      target.hasAttribute('data-line-index')
    ) {
      const lineIndex = parseInt(target.getAttribute('data-line-index'), 10);
      const isChecked = target.checked;

      const lines = content.split('\n');
      if (lines[lineIndex] === undefined) return;

      // Toggle the markdown task state
      const updatedLine = lines[lineIndex].replace(
        /\[[ xX]?\]/,
        isChecked ? '[x]' : '[ ]'
      );
      lines[lineIndex] = updatedLine;
      setContent(lines.join('\n'));
    }
  }

  function toTags(str) {
    return str
      .split(',')
      .map((t) => t.trim())
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
      pinned,
      favorite,
    });
  }

  // Lightweight Markdown Parser
  function parseMarkdown(text) {
    if (!text) return '';

    const escapeHtml = (str) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const parseInline = (value) => {
      let inner = value;
      // Images: ![alt](url)
      inner = inner.replace(
        /!\[(.*?)\]\((.*?)\)/g,
        '<img src="$2" alt="$1" />'
      );
      // Links: [text](url)
      inner = inner.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      );
      // Bold
      inner = inner.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      inner = inner.replace(/__(.*?)__/g, '<strong>$1</strong>');
      // Italics
      inner = inner.replace(/\*(.*?)\*/g, '<em>$1</em>');
      inner = inner.replace(/_(.*?)_/g, '<em>$1</em>');
      // Inline Code
      inner = inner.replace(/`([^`]+)`/g, '<code>$1</code>');
      return inner;
    };

    const lines = text.split('\n');
    let output = [];
    let inList = false;
    let listType = null;
    let inCodeBlock = false;
    let tableBuffer = [];

    const flushTable = () => {
      if (tableBuffer.length === 0) return;

      const rows = tableBuffer.map((row) =>
        row
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => c.trim())
      );

      let html = '<div class="table-container"><table>';

      // Check for separator line (e.g., |---|---|)
      let separatorIndex = -1;
      for (let i = 0; i < rows.length; i++) {
        const isSeparator =
          tableBuffer[i].replace(/[|\-:\s]/g, '') === '';
        if (isSeparator && i > 0) {
          separatorIndex = i;
          break;
        }
      }

      if (separatorIndex !== -1) {
        // Header
        html += '<thead><tr>';
        rows[0].forEach((cell) => {
          html += `<th>${parseInline(escapeHtml(cell))}</th>`;
        });
        html += '</tr></thead><tbody>';

        // Body
        for (let i = 1; i < rows.length; i++) {
          if (i === separatorIndex) continue;
          html += '<tr>';
          rows[i].forEach((cell) => {
            html += `<td>${parseInline(escapeHtml(cell))}</td>`;
          });
          html += '</tr>';
        }
        html += '</tbody>';
      } else {
        // No header detected, treat all as body
        html += '<tbody>';
        rows.forEach((r) => {
          html += '<tr>';
          r.forEach(
            (c) =>
              (html += `<td>${parseInline(escapeHtml(c))}</td>`)
          );
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
        if (inList) {
          output.push(listType === 'ul' ? '</ul>' : '</ol>');
          inList = false;
          listType = null;
        }

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
        if (inList) {
          output.push(listType === 'ul' ? '</ul>' : '</ol>');
          inList = false;
          listType = null;
        }
        tableBuffer.push(line);
        continue;
      } else {
        flushTable();
      }

      // Horizontal Rule
      if (line.trim() === '---' || line.trim() === '***') {
        if (inList) {
          output.push(listType === 'ul' ? '</ul>' : '</ol>');
          inList = false;
          listType = null;
        }
        output.push('<hr />');
        continue;
      }

      // Lists & Task Lists
      const taskMatch = line.match(
        /^\s*(-|\d+\.)\s+\[([ xX])\]\s+(.*)/
      );
      const isUl = /^\s*-\s+(.*)/.test(line);
      const isOl = /^\s*\d+\.\s+(.*)/.test(line);

      if (isUl || isOl) {
        let itemContent;
        let currentType;
        let isTask = false;
        let isChecked = false;

        if (taskMatch) {
          isTask = true;
          isChecked = taskMatch[2].toLowerCase() === 'x';
          itemContent = taskMatch[3];
          currentType = 'ul';
        } else {
          itemContent = line.replace(/^\s*(-|\d+\.)\s+/, '');
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
          const checkbox = `<input type="checkbox" data-line-index="${i}" ${
            isChecked ? 'checked' : ''
          } aria-label="Toggle task" />`;
          output.push(
            `<li class="task-list-item">${checkbox} <span>${parseInline(
              escapeHtml(itemContent)
            )}</span></li>`
          );
        } else {
          output.push(
            `<li>${parseInline(escapeHtml(itemContent))}</li>`
          );
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
        output.push(
          `<h1>${parseInline(escapeHtml(line.slice(2)))}</h1>`
        );
        continue;
      }
      if (line.startsWith('## ')) {
        output.push(
          `<h2>${parseInline(escapeHtml(line.slice(3)))}</h2>`
        );
        continue;
      }
      if (line.startsWith('### ')) {
        output.push(
          `<h3>${parseInline(escapeHtml(line.slice(4)))}</h3>`
        );
        continue;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        output.push(
          `<blockquote>${parseInline(
            escapeHtml(line.slice(2))
          )}</blockquote>`
        );
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
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'title-error' : undefined}
          />
        </label>
        {error && (
          <div
            id="title-error"
            style={{ color: 'var(--color-error)', fontSize: 13 }}
          >
            {error}
          </div>
        )}

        <div
          role="group"
          aria-label="Note flags"
          className="editor-flags"
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
        >
          <button
            type="button"
            className="btn btn-toggle"
            onClick={() => setPinned((v) => !v)}
            aria-pressed={pinned}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: 16,
                textAlign: 'center',
              }}
            >
              {pinned ? '📌' : '📍'}
            </span>
            {pinned ? 'Pinned' : 'Pin note'}
          </button>
          <button
            type="button"
            className="btn btn-toggle"
            onClick={() => setFavorite((v) => !v)}
            aria-pressed={favorite}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: 16,
                textAlign: 'center',
              }}
            >
              {favorite ? '★' : '☆'}
            </span>
            {favorite ? 'Favorited' : 'Mark favorite'}
          </button>
        </div>

        <div role="group" aria-label="Editor mode" className="editor-group">
          <div className="editor-header">
            <label
              className="input-label"
              style={{ marginBottom: 4 }}
            >
              Content
            </label>
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

          <div className="editor-panes">
            <div
              className={`editor-pane write-pane ${
                isPreview ? 'hidden-mobile' : ''
              }`}
            >
              <div className="pane-header">Write</div>
              <div className="editor-toolbar">
                <button
                  type="button"
                  className="btn-toolbar"
                  onClick={handleImageButtonClick}
                  aria-label="Insert image"
                  title="Insert image"
                >
                  Insert Image
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                  aria-hidden="true"
                />
              </div>
              <textarea
                ref={textareaRef}
                className="textarea"
                placeholder="Jot down your thoughts… (Markdown supported)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste}
                aria-label="Content editor"
              />
            </div>

            <div
              className={`editor-pane preview-pane ${
                !isPreview ? 'hidden-mobile' : ''
              }`}
            >
              <div className="pane-header">Preview</div>
              <div
                className="markdown-preview"
                dangerouslySetInnerHTML={{
                  __html:
                    parseMarkdown(content) ||
                    '<p style="color:var(--muted)">Nothing to preview</p>',
                }}
                aria-label="Markdown preview"
                tabIndex={0}
                onClick={handlePreviewClick}
              />
            </div>
          </div>
        </div>

        <label>
          Tags (comma separated)
          <input
            className="input"
            type="text"
            placeholder="work, personal, ideas"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
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
