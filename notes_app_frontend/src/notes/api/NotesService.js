const STORAGE_KEY = 'notes_app__notes_v1';

/**
 * Generate a simple unique ID based on timestamp and random.
 */
function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Ensure a loaded note object has all required fields including
 * newly added flags for pinned and favorite.
 */
function ensureFlags(note) {
  return {
    ...note,
    // default to false if missing to preserve backward compatibility
    pinned: typeof note.pinned === 'boolean' ? note.pinned : false,
    favorite: typeof note.favorite === 'boolean' ? note.favorite : false,
  };
}

/**
 * Read notes array from localStorage and normalize legacy items
 * that may not have pinned/favorite flags.
 */
function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(ensureFlags);
  } catch {
    return [];
  }
}

/**
 * Persist notes array to localStorage.
 */
function write(notes) {
  // Always store normalized notes so all items include pinned/favorite
  const normalized = Array.isArray(notes) ? notes.map(ensureFlags) : [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

/**
 * Normalize a note object for creation.
 * For create() we treat missing pinned/favorite as false. If a caller
 * explicitly provides these properties, they are respected.
 */
function normalize(note) {
  const now = new Date().toISOString();
  const base = {
    id: note.id || uid(),
    title: note.title?.trim() || 'Untitled',
    content: note.content || '',
    tags: Array.isArray(note.tags) ? note.tags : [],
    createdAt: note.createdAt || now,
    updatedAt: now,
  };

  const pinned =
    typeof note.pinned === 'boolean'
      ? note.pinned
      : typeof base.pinned === 'boolean'
      ? base.pinned
      : false;

  const favorite =
    typeof note.favorite === 'boolean'
      ? note.favorite
      : typeof base.favorite === 'boolean'
      ? base.favorite
      : false;

  return {
    ...base,
    pinned,
    favorite,
  };
}

/**
 * Sort helper that always surfaces pinned notes first, then applies
 * secondary sort rules. Secondary sort:
 *  - Within pinned group: updatedAt desc
 *  - Within unpinned group: updatedAt desc
 */
function sortPinnedFirst(notes) {
  const copy = [...notes];
  copy.sort((a, b) => {
    const aPinned = a.pinned ? 1 : 0;
    const bPinned = b.pinned ? 1 : 0;
    if (aPinned !== bPinned) {
      return bPinned - aPinned; // pinned (1) before unpinned (0)
    }
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
  return copy;
}

// PUBLIC_INTERFACE
export const NotesService = {
  /**
   * Get all notes.
   */
  async list() {
    const notes = read();
    return sortPinnedFirst(notes);
  },

  /**
   * Get single note by id.
   */
  async get(id) {
    const note = read().find((n) => n.id === id) || null;
    return note ? ensureFlags(note) : null;
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
   * This preserves existing pinned/favorite flags unless explicitly
   * overridden in the patch, ensuring partial updates work correctly.
   */
  async update(id, patch) {
    const notes = read();
    const idx = notes.findIndex((n) => n.id === id);
    if (idx === -1) return null;

    const current = ensureFlags(notes[idx]);

    const updated = ensureFlags({
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    });

    notes[idx] = updated;
    write(notes);
    return updated;
  },

  /**
   * Delete a note by id.
   */
  async remove(id) {
    const notes = read().filter((n) => n.id !== id);
    write(notes);
    return true;
  },

  /**
   * Get unique tags across notes.
   */
  async tags() {
    const set = new Set();
    read().forEach((n) => (n.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  },
};
