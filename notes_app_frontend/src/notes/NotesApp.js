import React, { useEffect, useMemo, useState } from 'react';
import '../App.css';
import { Layout } from './components/Layout';
import { Sidebar } from './components/Sidebar';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { NotesService } from './api/NotesService';
import { navigate, parseLocation, routes } from './router';

/**
 * Main Notes Application with simple hash-based routing and localStorage persistence.
 */
// PUBLIC_INTERFACE
export function NotesApp() {
  const [route, setRoute] = useState(parseLocation());
  const [notes, setNotes] = useState([]);
  const [tags, setTags] = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const [search, setSearch] = useState('');

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

  const filteredNotes = useMemo(() => {
    if (!activeTag) return notes;
    return notes.filter(n => (n.tags || []).includes(activeTag));
  }, [notes, activeTag]);

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

  const sidebarEl = (
    <Sidebar
      tags={tags}
      activeTag={activeTag}
      onSelectTag={setActiveTag}
    />
  );

  function onNewClick() {
    navigate(routes.new);
  }

  // Route rendering
  if (route.name === 'new') {
    return (
      <Layout sidebar={sidebarEl} onNewClick={onNewClick}>
        <NoteEditor
          onSave={onCreate}
          onCancel={() => navigate(routes.home)}
        />
      </Layout>
    );
  }

  if (route.name === 'edit') {
    const current = notes.find(n => n.id === route.params?.id);
    return (
      <Layout sidebar={sidebarEl} onNewClick={onNewClick}>
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
    <Layout sidebar={sidebarEl} onNewClick={onNewClick}>
      <NoteList
        notes={filteredNotes}
        onEdit={(id) => navigate(routes.edit(id))}
        onOpen={(id) => navigate(routes.edit(id))}
        onDelete={onDelete}
        search={search}
        setSearch={setSearch}
      />
    </Layout>
  );
}
