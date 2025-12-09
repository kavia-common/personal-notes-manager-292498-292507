# Personal Notes App (Ocean Professional)

A lightweight React frontend for managing personal notes (create, view, edit, delete) with localStorage persistence and an abstracted API layer, styled with the Ocean Professional theme.

## Features
- Create, edit, delete notes
- Search notes and filter by tags (basic)
- Hash-based routing (no extra dependencies)
- Responsive layout: top nav, sidebar for tags, main content for list/editor
- Accessible focus styles and semantic roles
- Abstracted NotesService to allow swapping to a backend later

## Run
- npm start
- npm run build
- npm test

Open http://localhost:3000

## Environment
The app reads standard React env variables if defined, but does not depend on a backend:
- REACT_APP_API_BASE
- REACT_APP_BACKEND_URL
- REACT_APP_FRONTEND_URL
- REACT_APP_WS_URL
- REACT_APP_NODE_ENV
- REACT_APP_NEXT_TELEMETRY_DISABLED
- REACT_APP_ENABLE_SOURCE_MAPS
- REACT_APP_PORT
- REACT_APP_TRUST_PROXY
- REACT_APP_LOG_LEVEL
- REACT_APP_HEALTHCHECK_PATH
- REACT_APP_FEATURE_FLAGS
- REACT_APP_EXPERIMENTS_ENABLED

## Theming
Ocean Professional palette (see src/App.css):
- Primary: #2563EB
- Secondary: #F59E0B
- Error: #EF4444
- Background: #f9fafb
- Surface: #ffffff
- Text: #111827

## Swap Local to Backend
Replace implementations inside src/notes/api/NotesService.js with network calls using env vars above. The UI will keep working without changes.
