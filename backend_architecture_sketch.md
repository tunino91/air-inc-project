# Backend Architecture Sketch

## High-Level Flow

```mermaid
flowchart TD
    A[Client / Frontend] -->|HTTP REST| B[Express App]
    A -->|Socket.IO connect| H[Socket.IO Server]

    B --> C[Board Routes]
    C --> D[Board Service]
    D --> E[Board Repository]
    E --> F[(PostgreSQL)]

    B --> G[Error Handler]

    D -->|emit board.created / moved / deleted / seeded| H
    H -->|broadcast events| A
```

## Runtime Startup

```mermaid
flowchart TD
    A[index.ts] --> B[Create Database pool]
    B --> C[Run migrations]
    C --> D[Create BoardService]
    D --> E[Create Express app]
    E --> F[Create HTTP server]
    F --> G[Attach Socket.IO]
    G --> H[Listen on configured port]
```

## Request Path

```mermaid
sequenceDiagram
    participant Client
    participant Router as Express Route
    participant Service as BoardService
    participant Repo as BoardRepository
    participant DB as PostgreSQL
    participant IO as Socket.IO

    Client->>Router: POST /api/boards or PATCH /move or DELETE
    Router->>Service: validate request shape + call service
    Service->>Repo: fetch/check tree state
    Repo->>DB: run SQL / recursive CTEs
    DB-->>Repo: rows / computed values
    Repo-->>Service: mapped records
    Service->>Service: enforce business rules
    Service->>Repo: insert/update/delete
    Repo->>DB: write change
    DB-->>Repo: result
    Repo-->>Service: updated record / delete result
    Service->>IO: emit domain event
    Service-->>Router: response payload
    Router-->>Client: JSON response
```

## Layer Responsibilities

- `index.ts`
  - boots the app
  - creates DB connection pool
  - runs migrations
  - wires Express and Socket.IO together

- `app.ts`
  - creates the Express app
  - configures CORS and JSON parsing
  - mounts routes
  - mounts not-found and error handlers

- `routes/boards.ts`
  - validates request shape
  - parses nullable `parentId`
  - calls the service layer
  - returns JSON responses

- `services/boardService.ts`
  - owns business rules
  - validates board name
  - enforces max depth
  - prevents invalid moves and cycles
  - builds the tree response
  - emits board lifecycle events

- `repositories/boardRepository.ts`
  - contains DB queries
  - handles recursive CTEs for:
    - board depth
    - subtree height
    - descendant checks
    - subtree ID collection

- `db/*`
  - creates the pool
  - supports transactions
  - runs schema migrations

- `events/boardEvents.ts`
  - abstracts event publishing
  - lets the service emit events without depending directly on Socket.IO

## Current Data Model

```mermaid
erDiagram
    BOARDS {
        UUID id PK
        TEXT name
        UUID parent_id FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    BOARDS ||--o{ BOARDS : parent_child
```

## Important Backend Behaviors

- Create board
  - validates name
  - checks parent exists
  - checks `parent depth + 1 <= max depth`
  - inserts row
  - emits `board.created`

- Move board
  - checks source exists
  - checks destination exists
  - blocks move into self
  - blocks move into descendant
  - checks `destination depth + subtree height <= max depth`
  - updates `parent_id`
  - emits `board.moved`

- Delete board
  - collects subtree IDs
  - deletes root node
  - DB cascades descendants via `ON DELETE CASCADE`
  - emits `board.deleted`

- Seed boards
  - generates a template hierarchy
  - inserts the whole structure in a transaction
  - emits `boards.seeded`

## Current Realtime Model

```mermaid
flowchart LR
    A[BoardService] -->|emit event| B[Socket.IO Server]
    B -->|io.emit to all clients| C[Browser Tab 1]
    B -->|io.emit to all clients| D[Browser Tab 2]
    B -->|io.emit to all clients| E[Browser Tab N]
```

- current implementation uses global broadcast
- there are no rooms yet
- there is no socket auth yet
- frontend reacts by invalidating and refetching the board tree

## Main Tradeoffs In Current Backend

- simple adjacency-list schema instead of more complex hierarchy models
- raw SQL instead of ORM for clarity around recursive logic
- service-layer validation instead of DB-trigger enforcement
- global socket broadcast instead of workspace-scoped rooms
- no explicit row locking for concurrent tree edits
- full-tree reads are simple now, but would need refinement at larger scale
