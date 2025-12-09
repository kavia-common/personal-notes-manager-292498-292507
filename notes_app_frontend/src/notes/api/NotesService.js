const STORAGE_KEY = 'notes_app__notes_v1';

/**
 * Generate a simple unique ID based on timestamp and random.
 */
function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Read notes array from localStorage.
 */
function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Persist notes array to localStorage.
 */
function write(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

/**
 * Normalize a note object.
 */
function normalize(note) {
  const now = new Date().toISOString();
  return {
    id: note.id || uid(),
    title: note.title?.trim() || 'Untitled',
    content: note.content || '',
    tags: Array.isArray(note.tags) ? note.tags : [],
    createdAt: note.createdAt || now,
    updatedAt: now,
  };
}

// PUBLIC_INTERFACE
export const NotesService = {
  /**
   * Get all notes.
   */
  async list() {
    return read().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  /**
   * Get single note by id.
   */
  async get(id) {
    return read().find(n => n.id === id) || null;
  },

  /**
   * Create a new note.
   */
  async create(note) {
    const notes = read();
    const n = normalize(note || {});
    notes.unshift(n);
    write(notes);
    return n;
  },

  /**
   * Update an existing note by id.
   */
  async update(id, patch) {
    const notes = read();
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) return null;
    const updated = { ...notes[idx], ...patch, updatedAt: new Date().toISOString() };
    notes[idx] = updated;
    write(notes);
    return updated;
  },

  /**
   * Delete a note by id.
   */
  async remove(id) {
    const notes = read().filter(n => n.id !== id);
    write(notes);
    return true;
  },

  /**
   * Get unique tags across notes.
   */
  async tags() {
    const set = new Set();
    read().forEach(n => (n.tags || []).forEach(t => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  },
};
