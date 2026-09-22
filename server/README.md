# StudyMate backend

The Express service uses one existing Azure AI Foundry agent. Each core feature sends it a focused task prompt:

| Route | Agent environment variable | Task prompt |
| --- | --- | --- |
| `POST /api/ask` | `STUDYMATE_AGENT_ID` | Grounded notes/RAG tutor |
| `POST /api/quiz` | `STUDYMATE_AGENT_ID` | Quiz generator |
| `POST /api/study-plan` | `STUDYMATE_AGENT_ID` | Personalized planner |

## Set up

1. Copy `.env.example` to `.env` and enter the Foundry project endpoint plus your one agent ID.
2. Authenticate the server identity. For local development, run `az login`; for Azure deployment, assign the app a managed identity with permission to use the Foundry project.
3. Install dependencies with `npm install`, then run `npm run server:watch`.

The frontend can run separately with `npm run dev`. Its `VITE_API_BASE_URL` should be `http://localhost:5000`.

`GET /health` reports missing configuration without exposing any secret.

## Document ingestion

`POST /api/documents` accepts up to five supported study files (20 MB each), using multipart field `files`. It persists them locally for now. The exact indexing call depends on how your notes agent was configured (Foundry file search, Azure AI Search, or another knowledge source), so this is intentionally one clean handoff point rather than duplicating an incompatible index.
