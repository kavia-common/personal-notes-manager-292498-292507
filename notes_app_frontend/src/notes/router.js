export const routes = {
  home: '#/',
  new: '#/new',
  edit: (id) => `#/edit/${encodeURIComponent(id)}`,
};

export function parseLocation(hash) {
  const clean = (hash || window.location.hash || '#/').replace(/^#/, '#');
  if (clean === '#/' || clean === '#') return { name: 'home' };
  if (clean === '#/new') return { name: 'new' };
  const editMatch = clean.match(/^#\/edit\/(.+)$/);
  if (editMatch) return { name: 'edit', params: { id: decodeURIComponent(editMatch[1]) } };
  return { name: 'home' };
}

export function navigate(to) {
  window.location.hash = to;
}
