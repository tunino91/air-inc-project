# Air Board Hierarchy Challenge

A full-stack board hierarchy manager built on Express, PostgreSQL, Next.js, TypeScript, and Socket.IO. The app supports nested boards up to a maximum depth of 10, recursive deletion, validated moves, live multi-tab sync, and a guided starter-hierarchy generator.

## Stack

- Backend: Express + TypeScript + `pg`
- Frontend: Next.js App Router + React + TypeScript
- State: TanStack Query + Redux Toolkit
- Database: PostgreSQL
- Realtime: Socket.IO
- Tests: Jest + Supertest
- Runtime: Docker Compose

## Features

- Create root boards and nested child boards
- Expand and collapse nested branches in the hierarchy
- Move boards to a different parent or back to root
- Move boards with drag-and-drop or the explicit move modal
- Prevent moves that create cycles or exceed the depth limit
- Delete boards recursively with all descendants
- Retrieve the full hierarchy as a tree
- Generate a realistic starter hierarchy from a short seed wizard
- Sync hierarchy changes across browser tabs via Socket.IO

## Quick Start

1. Copy the environment file:

```bash
cp .env.example .env
```

2. Start the full stack:

```bash
docker compose up --build
```

3. Open the app:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend health: [http://localhost:3001/api/health](http://localhost:3001/api/health)

The project publishes PostgreSQL on `localhost:5433` to avoid colliding with common local Postgres setups.
If `3000` or `3001` is already taken, change `WEB_PORT` or `API_PORT` in `.env` before starting Compose.
If you change `API_PORT`, also update `NEXT_PUBLIC_WS_URL` so browser-side Socket.IO continues to target the right backend port.

## Local Development

### Start only PostgreSQL

```bash
docker compose up -d postgres
```

### Backend

```bash
cd backend
npm install
npm run dev
```

The backend defaults to:

- `DB_HOST=localhost`
- `DB_PORT=5433`
- `DB_USERNAME=app_user`
- `DB_PASSWORD=app_password`
- `DB_NAME=app_db`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend uses a Next.js rewrite for `/api/*`, while Socket.IO connects directly to the backend via `NEXT_PUBLIC_WS_URL`.

## Testing

### Backend integration tests

Start PostgreSQL first:

```bash
docker compose up -d postgres
```

Then run the backend integration suite:

```bash
cd backend
npm test
```

The integration tests cover:

- root and child board creation
- max-depth rejection
- tree retrieval
- valid and invalid move cases
- recursive delete
- starter hierarchy generation

### Frontend component tests

```bash
cd frontend
npm test -- --runInBand
```

The frontend tests currently cover:

- seed wizard step progression and submission
- recursive tree rendering
- expand/collapse interactions
- board row action callbacks

## API

### `GET /api/boards/tree`

Returns:

```json
{
  "boards": [
    {
      "id": "uuid",
      "name": "Launch Workspace",
      "parentId": null,
      "depth": 1,
      "createdAt": "2026-03-12T10:00:00.000Z",
      "updatedAt": "2026-03-12T10:00:00.000Z",
      "children": []
    }
  ]
}
```

### `POST /api/boards`

```json
{
  "name": "Spring Launch",
  "parentId": null
}
```

### `PATCH /api/boards/:id/move`

```json
{
  "parentId": "destination-board-id-or-null"
}
```

### `DELETE /api/boards/:id`

Returns:

```json
{
  "deletedIds": ["uuid-1", "uuid-2"]
}
```

### `POST /api/boards/seed`

```json
{
  "projectType": "Campaign Launch",
  "teamType": "Brand Studio",
  "campaignCount": 3,
  "includeArchive": true
}
```

## Architecture Notes

- The backend uses raw SQL and recursive CTEs for depth calculation, subtree height checks, descendant detection, and delete previews.
- Schema changes are handled through SQL migrations tracked in a `schema_migrations` table.
- The service layer owns business rules so REST handlers stay thin and tests can focus on behavior.
- The frontend keeps server state in TanStack Query and UI-only state in Redux Toolkit.
- The board manager is split into focused hooks and components so data loading, mutations, drag-and-drop orchestration, dialogs, and tree rendering stay isolated.
- Socket.IO broadcasts `board.created`, `board.moved`, `board.deleted`, and `boards.seeded`; the frontend responds by invalidating the tree query.

## Design Decisions and Tradeoffs

I chose PostgreSQL over an embedded database because it better reflects the production shape of a collaborative content-management product and gives the submission stronger signal around data modeling, recursive queries, and containerized local development. I used raw SQL via `pg` rather than an ORM because board trees and move validation rely on recursive CTEs and subtree calculations, which are clearer and easier to control directly in SQL for a challenge of this size.

On the frontend, I kept server data, UI state, and interaction behavior separated so the main board manager does not become a bloated controller component. The hierarchy supports drag-and-drop for a more natural move flow, but the backend remains the source of truth for cycle prevention and depth validation, so invalid moves are still enforced centrally. The seed wizard is deliberately constrained and template-based rather than prompt-driven so it remains predictable, fast to demo, and consistent with backend validation.

## Future Improvements

- add SQL migration rollback support and a dedicated migration CLI
- add frontend interaction tests and end-to-end coverage
- support search and lazy-loading for very large hierarchies
- add optimistic updates for local mutations
- add auth, workspace scoping, and role-based permissions
- persist workspace metadata so the UI can label seeded hierarchies with their project/team context
- improve drag-and-drop accessibility with keyboard interactions and richer drop indicators
- enhance the seed wizard with more workspace templates and preview detail
