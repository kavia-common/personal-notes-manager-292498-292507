import React from 'react';

/**
 * Layout with top navigation and two-column shell (sidebar + content).
 */
// PUBLIC_INTERFACE
export function Layout({ 
  children, 
  sidebar, 
  onNewClick, 
  currentTheme = 'light', 
  onToggleTheme = () => {} 
}) {
  const isDark = currentTheme === 'dark';
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <div className="app-root">
      <header className="topnav" role="banner">
        <div className="topnav-inner" aria-label="Top Navigation">
          <div className="brand" aria-label="Personal Notes Manager">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-title">Personal Notes</span>
          </div>
          <div className="actions">
            <button 
              className="btn" 
              onClick={onToggleTheme} 
              aria-label={label}
              title={label}
            >
              {isDark ? '☀' : '☾'}
            </button>
            <button className="btn btn-primary" onClick={onNewClick} aria-label="Create new note">
              ➕ New Note
            </button>
          </div>
        </div>
      </header>

      <div className="shell">
        <aside className="sidebar" aria-label="Categories and Tags">
          {sidebar}
        </aside>
        <main className="content" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
