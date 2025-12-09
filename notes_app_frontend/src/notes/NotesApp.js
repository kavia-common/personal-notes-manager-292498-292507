import React, { useEffect, useMemo, useState } from 'react';
import '../App.css';
import { Layout } from './components/Layout';
import { Sidebar } from './components/Sidebar';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { NotesService } from './api/NotesService';
import { navigate, parseLocation, routes } from './router';

const FILTERS_STORAGE_KEY = 'notes_filters';

/**
 * Safely load persisted filters from localStorage.
 */
function loadPersistedFilters() {
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;

    return {
      selectedTags: Array.isArray(parsed.selectedTags) ? parsed.selectedTags : [],
      favoritesOnly: Boolean(parsed.favoritesOnly),
      pinnedOnly: Boolean(parsed.pinnedOnly),
      search: typeof parsed.search === 'string' ? parsed.search : '',
      sortBy: typeof parsed.sortBy === 'string' ? parsed.sortBy : 'pinned',
    };
  } catch {
    return null;
  }
}

/**
 * Persist filters to localStorage.
 */
function persistFilters(filters) {
  try {
    const payload = {
      selectedTags: filters.selectedTags,
      favoritesOnly: filters.favoritesOnly,
      pinnedOnly: filters.pinnedOnly,
      search: filters.search,
      sortBy: filters.sortBy,
    };
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore persistence errors
  }
}

/**
 * Apply filters, then search, then sort to the notes list.
 */
function selectVisibleNotes(notes, filters) {
  const {
    selectedTags = [],
    favoritesOnly = false,
    pinnedOnly = false,
    search = '',
    sortBy = 'pinned',
  } = filters || {};

  let result = Array.isArray(notes) ? [...notes] : [];

  // 1. Tag filter: keep notes that have ANY of the selected tags.
  if (selectedTags.length > 0) {
    const set = new Set(selectedTags);
    result = result.filter((n) => (n.tags || []).some((t) => set.has(t)));
  }

  // 2. Favorites / Pinned toggles
  if (favoritesOnly) {
    result = result.filter((n) => Boolean(n.favorite));
  }
  if (pinnedOnly) {
    result = result.filter((n) => Boolean(n.pinned));
  }

  // 3. Text search within filtered set
  const q = (search || '').trim().toLowerCase();
  if (q) {
    result = result.filter((n) => {
      const title = (n.title || '').toLowerCase();
      const content = (n.content || '').toLowerCase();
      const tagsText = (n.tags || []).join(' ').toLowerCase();
      return (
        title.includes(q) ||
        content.includes(q) ||
        tagsText.includes(q)
      );
    });
  }

  // 4. Sorting
  if (sortBy === 'updated') {
    result.sort((a, b) => {
      const aPinned = a.pinned ? 1 : 0;
      const bPinned = b.pinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  } else if (sortBy === 'title') {
    result.sort((a, b) => {
      const aPinned = a.pinned ? 1 : 0;
      const bPinned = b.pinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return (a.title || '').localeCompare(b.title || '');
    });
  }
  // sortBy === 'pinned' uses the existing NotesService.list() order,
  // which comes in as pinned-first / updated desc. We already copied
  // notes above, but we keep original relative ordering for this case.

  return result;
}

/**
 * Main Notes Application with simple hash-based routing and localStorage persistence.
 */
// PUBLIC_INTERFACE
export function NotesApp() {
  const [route, setRoute] = useState(parseLocation());
  const [notes, setNotes] = useState([]);
  const [tags, setTags] = useState([]);
  const [activeTag, setActiveTag] = useState(null);

  // Filters and UI state
  const persisted = loadPersistedFilters();
  const [selectedTags, setSelectedTags] = useState(
    persisted?.selectedTags || []
  );
  const [favoritesOnly, setFavoritesOnly] = useState(
    persisted?.favoritesOnly || false
  );
  const [pinnedOnly, setPinnedOnly] = useState(
    persisted?.pinnedOnly || false
  );
  const [search, setSearch] = useState(persisted?.search || '');
  const [sortBy, setSortBy] = useState(persisted?.sortBy || 'pinned'); // 'pinned' | 'updated' | 'title'

  // Theme state
  const [theme, setTheme] = useState(
    () => localStorage.getItem('notes_theme') || 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('notes_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'dark' === t ? 'light' : 'light'));

  // Load notes and tags
  const refresh = async () => {
    const [n, t] = await Promise.all([NotesService.list(), NotesService.tags()]);
    setNotes(n);
    setTags(t);
  };

  useEffect(() => {
    refresh();
  }, []);

  // Simple hash router
  useEffect(() => {
    const onHashChange = () => setRoute(parseLocation(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Keep filters in localStorage
  useEffect(() => {
    persistFilters({ selectedTags, favoritesOnly, pinnedOnly, search, sortBy });
  }, [selectedTags, favoritesOnly, pinnedOnly, search, sortBy]);

  // Map the legacy sidebar "activeTag" to the new selectedTags filter.
  useEffect(() => {
    if (activeTag == null) return;
    setSelectedTags((prev) =>
      prev.includes(activeTag) ? prev : [...prev, activeTag]
    );
  }, [activeTag]);

  const visibleNotes = useMemo(
    () =>
      selectVisibleNotes(notes, {
        selectedTags,
        favoritesOnly,
        pinnedOnly,
        search,
        sortBy,
      }),
    [notes, selectedTags, favoritesOnly, pinnedOnly, search, sortBy]
  );

  async function onCreate(data) {
    await NotesService.create(data);
    await refresh();
    navigate(routes.home);
  }

  async function onUpdate(id, patch) {
    await NotesService.update(id, patch);
    await refresh();
    navigate(routes.home);
  }

  async function onDelete(id) {
    const ok = window.confirm('Delete this note? This cannot be undone.');
    if (!ok) return;
    await NotesService.remove(id);
    await refresh();
  }

  async function onTogglePinned(id) {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    await NotesService.update(id, { pinned: !note.pinned });
    await refresh();
  }

  async function onToggleFavorite(id) {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    await NotesService.update(id, { favorite: !note.favorite });
    await refresh();
  }

  const sidebarEl = (
    <Sidebar tags={tags} activeTag={activeTag} onSelectTag={setActiveTag} />
  );

  function onNewClick() {
    navigate(routes.new);
  }

  const layoutProps = {
    sidebar: sidebarEl,
    onNewClick: onNewClick,
    currentTheme: theme,
    onToggleTheme: toggleTheme,
  };

  // Route rendering
  if (route.name === 'new') {
    return (
      <Layout {...layoutProps}>
        <NoteEditor
          onSave={onCreate}
          onCancel={() => navigate(routes.home)}
        />
      </Layout>
    );
  }

  if (route.name === 'edit') {
    const current = notes.find((n) => n.id === route.params?.id);
    return (
      <Layout {...layoutProps}>
        <NoteEditor
          initial={current}
          onSave={(patch) => onUpdate(route.params.id, patch)}
          onCancel={() => navigate(routes.home)}
        />
      </Layout>
    );
  }

  // home/list
  return (
    <Layout {...layoutProps}>
      <NoteList
        notes={visibleNotes}
        allTags={tags}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        favoritesOnly={favoritesOnly}
        setFavoritesOnly={setFavoritesOnly}
        pinnedOnly={pinnedOnly}
        setPinnedOnly={setPinnedOnly}
        onEdit={(id) => navigate(routes.edit(id))}
        onOpen={(id) => navigate(routes.edit(id))}
        onDelete={onDelete}
        onTogglePinned={onTogglePinned}
        onToggleFavorite={onToggleFavorite}
        search={search}
        setSearch={setSearch}
        sortBy={sortBy}
        setSortBy={setSortBy}
        allNotes={notes} // Pass all notes for JSON export (ignores filters)
        currentNote={null} // No current note in list view
        onRefresh={refresh} // Pass refresh function for after import
      />
    </Layout>
  );
}
