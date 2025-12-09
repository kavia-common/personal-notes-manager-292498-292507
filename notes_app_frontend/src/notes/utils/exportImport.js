/**
 * Utility functions for exporting and importing notes.
 * Supports JSON export/import and Markdown export with optional import.
 */

/**
 * Generate a safe filename with timestamp
 */
function generateTimestampedFilename(prefix, extension) {
  const now = new Date();
  const timestamp = now.getFullYear() + 
    String(now.getMonth() + 1).padStart(2, '0') + 
    String(now.getDate()).padStart(2, '0') + '-' +
    String(now.getHours()).padStart(2, '0') + 
    String(now.getMinutes()).padStart(2, '0');
  return `${prefix}-${timestamp}.${extension}`;
}

/**
 * Create and trigger download of a file
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// PUBLIC_INTERFACE
export const ExportImportUtils = {
  /**
   * Export all notes as JSON
   */
  exportNotesAsJSON(notes) {
    try {
      const exportData = Array.isArray(notes) ? notes : [];
      const jsonContent = JSON.stringify(exportData, null, 2);
      const filename = generateTimestampedFilename('notes-export', 'json');
      
      downloadFile(jsonContent, filename, 'application/json');
      return { success: true, filename };
    } catch (error) {
      console.error('Error exporting notes as JSON:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Export single note or multiple notes as Markdown
   */
  exportNotesAsMarkdown(notes) {
    try {
      const notesToExport = Array.isArray(notes) ? notes : [notes];
      
      if (notesToExport.length === 0) {
        return { success: false, error: 'No notes to export' };
      }

      let markdownContent = '';
      
      if (notesToExport.length === 1) {
        // Single note export
        const note = notesToExport[0];
        markdownContent = `# ${note.title || 'Untitled'}\n\n${note.content || ''}`;
        
        const filename = `${(note.title || 'untitled').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.md`;
        downloadFile(markdownContent, filename, 'text/markdown');
        return { success: true, filename };
      } else {
        // Multiple notes export - concatenate with separators
        markdownContent = notesToExport
          .map(note => `# ${note.title || 'Untitled'}\n\n${note.content || ''}`)
          .join('\n\n---\n\n');
        
        const filename = generateTimestampedFilename('notes-export', 'md');
        downloadFile(markdownContent, filename, 'text/markdown');
        return { success: true, filename };
      }
    } catch (error) {
      console.error('Error exporting notes as Markdown:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Parse and validate JSON file for import
   */
  async parseJSONFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || file.type !== 'application/json') {
        reject(new Error('Please select a valid JSON file'));
        return;
      }

      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error('File too large. Maximum size is 10MB'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const parsed = JSON.parse(content);
          
          if (!Array.isArray(parsed)) {
            reject(new Error('JSON file must contain an array of notes'));
            return;
          }

          // Validate note structure
          const validatedNotes = parsed.map((note, index) => {
            if (!note || typeof note !== 'object') {
              throw new Error(`Invalid note at index ${index}: must be an object`);
            }
            
            return {
              id: note.id || null, // Will be regenerated if null
              title: typeof note.title === 'string' ? note.title : 'Imported Note',
              content: typeof note.content === 'string' ? note.content : '',
              tags: Array.isArray(note.tags) ? note.tags.filter(t => typeof t === 'string') : [],
              pinned: typeof note.pinned === 'boolean' ? note.pinned : false,
              favorite: typeof note.favorite === 'boolean' ? note.favorite : false,
              createdAt: note.createdAt || new Date().toISOString(),
              updatedAt: note.updatedAt || new Date().toISOString(),
            };
          });

          resolve(validatedNotes);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  },

  /**
   * Parse Markdown file and create a single note
   */
  async parseMarkdownFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.name.toLowerCase().endsWith('.md')) {
        reject(new Error('Please select a valid Markdown (.md) file'));
        return;
      }

      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error('File too large. Maximum size is 10MB'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          
          // Extract title from first H1 or use filename
          const lines = content.split('\n');
          let title = file.name.replace(/\.md$/i, '');
          let contentStart = 0;
          
          // Look for first H1 heading
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('# ')) {
              title = line.substring(2).trim();
              contentStart = i + 1;
              break;
            }
          }
          
          // Get content (everything after title or entire content)
          const noteContent = lines.slice(contentStart).join('\n').trim();
          
          const note = {
            id: null, // Will be generated
            title: title || 'Imported Note',
            content: noteContent,
            tags: [],
            pinned: false,
            favorite: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          resolve([note]); // Return as array for consistency
        } catch (error) {
          reject(new Error(`Failed to parse Markdown: ${error.message}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  },

  /**
   * Import notes and merge with existing storage
   * Returns summary of operation
   */
  async importNotes(notesToImport, existingNotes, NotesService) {
    try {
      const summary = {
        added: 0,
        updated: 0,
        skipped: 0,
        total: notesToImport.length
      };

      const existingIds = new Set(existingNotes.map(note => note.id));
      
      for (const importNote of notesToImport) {
        if (importNote.id && existingIds.has(importNote.id)) {
          // ID conflict - generate new ID
          const newNote = { ...importNote, id: null };
          await NotesService.create(newNote);
          summary.added++;
        } else if (importNote.id) {
          // No conflict - create with existing ID
          await NotesService.create(importNote);
          summary.added++;
        } else {
          // No ID - create new
          await NotesService.create(importNote);
          summary.added++;
        }
      }

      return { success: true, summary };
    } catch (error) {
      console.error('Error importing notes:', error);
      return { success: false, error: error.message };
    }
  }
};
