# StudyMate AI — Frontend

A polished React + Vite frontend inspired by the screenshots supplied in the prompt.

## Included features

- Upload PDF/PPT/PPTX/DOC/DOCX/TXT/MD study material
- Ask My Notes
- RAG-style cited demo answers
- Beginner / Intermediate / Advanced / Exam Mode
- AI quiz generator
- Quiz evaluation + score + answer review
- Weak topic detection
- Adaptive practice
- Personalized study planner
- Previous question-paper analyzer
- AI Study Agent orchestration UI
- Student dashboard and performance charts
- Voice input using browser Web Speech API
- Voice playback using browser speech synthesis
- Responsible AI messaging and source citations
- Responsive mobile/tablet layout
- Frontend API abstraction ready for Flask/FastAPI/Node/Azure backend

## Run

```bash
npm install
npm run dev
```

Open the URL printed by Vite, usually:

```text
http://localhost:5173
```

## Backend connection

Create `.env` from `.env.example`:

```text
VITE_API_BASE_URL=http://localhost:5000
```

The frontend will work in demo mode if this variable is empty.

Expected API endpoints:

- `POST /api/ask`
- `POST /api/quiz`
- `POST /api/study-plan`

## Azure / Speech

Do not put Azure API keys in React/Vite frontend code. Keep Azure credentials on your backend and expose only your backend endpoint through `VITE_API_BASE_URL`.

## Login / Signup

Login and signup are implemented as an in-app modal, not a separate page. The entered name is stored in browser `localStorage` and shown automatically in the dashboard greeting:

`Good morning, <your name>`

For production, replace the demo localStorage authentication with your backend/Azure/Entra authentication service.
