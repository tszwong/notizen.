# Notizen — AI‑Powered Notes & Task App

Notizen is a solo‑built, full‑stack productivity app that turns freeform notes into structured, actionable workflows using AI. It combines a rich WYSIWYG note editor with AI summarization, task extraction and auto list creation, real‑time sync, analytics, and lightweight productivity tools (heatmap, streaks, priorities).

---

## Why this project

- People lose actionable items inside long notes. Notizen makes those actions discoverable and actionable with a single click.  
- AI helps reduce manual entry and surface important items (tasks, dates, priorities, tags) from unstructured text.  
- Focus on reliability: robust JSON recovery, sanitization, and Firestore‑safe writes ensure AI output converts safely into product data and metrics.

Goals
- Reduce friction for task capture and scheduling.
- Keep AI output trustworthy and auditable.
- Maintain accurate analytics (priority distribution, completion counts, activity heatmap).
- Provide a compact, usable UI for quick capture and review.

---

## Key features

- Rich note editor (React + Quill) with voice input (speech‑to‑text) and selection actions.
- AI summarization (serverless `/api/summarize`) powered by Google Gemini.
- AI task extraction (serverless `/api/extractTasks`) — extracts tasks, priorities, due dates (resolved from relative language when context provided), descriptions and tags.
- Auto‑create lists from extracted tasks (CreateListFromExtraction flow) with atomic Firestore updates.
- Real‑time sync and auth with Firebase / Firestore.
- Activity tracking & calendar heatmap to visualize streaks.
- Dashboard with priority distribution (pie chart), completion stats, and task overviews.
- Defensive data handling: JSON recovery, strip undefined, truncate inputs, and validate before Firestore writes.
- UI niceties: animated panels, peeking mascot, drag‑and‑drop reordering, hold‑to‑complete interactions.

---

## Architecture (high level)

- Frontend: React + TypeScript (Vite), components under `src/components` (NoteEditor, ToDoList, AIResponseDisplay, Dashboard, etc.)
- Backend: Lightweight serverless endpoints in `notes/api/`:
  - `/api/summarize` — Gemini summarization wrapper
  - `/api/extractTasks` — Gemini extraction wrapper with prompt engineering & JSON sanitization
- Data: Firebase Authentication + Firestore
  - Collections: `documents`, `users/{uid}/todoLists`, `users/{uid}/aiSummaries`, `users/{uid}/aiTasks`, `users/{uid}/tags`, `users/{uid}/stats/main`
- AI Model settings:
  - Model: `gemini-2.0-flash-exp`
  - Typical config: `maxOutputTokens = 1000`, input truncation ≈ 15k chars (server side)
  - Prompt includes current date context to resolve relative dates (e.g., "in 2 days", "next Monday")

---

## Notable implementation details

- Prompt engineering: prompts instruct the model to return strict JSON arrays and to only resolve due dates when explicit or when relative phrases are present and the current date is supplied.
- JSON recovery: server endpoint strips code fences, attempts bracket‑matching, and uses minimal wrappers to recover valid JSON before saving.
- Date handling: frontend/logic uses local date helpers (e.g., `getLocalDateString`) to avoid UTC offset issues when resolving or formatting dates.
- Atomic stats updates: use Firestore `increment(n)` to atomically update `taskStats.created`, `taskStats.completed`, and `priorityCounts.{low|medium|high}`.
- Metrics synchronization: when creating lists from AI extraction, the flow updates Firestore stats after successful list creation to keep analytics accurate.
- Defensive writes: strip undefined fields, trim long strings, constrain arrays to expected types before `setDoc`/`addDoc`.

Files of interest
- Frontend components: `src/components/NoteEditor.tsx`, `src/components/ToDoList.tsx`, `src/components/AIResponseDisplay.tsx`, `src/components/Dashboard.tsx`
- AI endpoints: `notes/api/extractTasks.js`, `notes/api/summarize.js`
- Firestore helpers: `src/utils/notesFirestore.ts`
- Task/list creation flow: `src/utils/CreateListFromExtraction.tsx`
- Activity tracking: `src/utils/activityTracker.ts`
- Priority stats helper: `src/utils/GetPrioCompletionStats.tsx`

---

## Getting started (local dev)

Prereqs
- Node 18+
- Firebase project + Web credentials
- GOOGLE_STUDIO_API_KEY (for Gemini access)

Environment
- Create `.env` at project root (or configure as required by Vite)
  - VITE_FIREBASE_API_KEY=...
  - VITE_FIREBASE_AUTH_DOMAIN=...
  - VITE_FIREBASE_PROJECT_ID=...
  - GOOGLE_STUDIO_API_KEY=...

Install and run
- Install:
  - npm install
- Run dev:
  - npm run dev
- Build:
  - npm run build
- Preview production build:
  - npm run preview

Serverless endpoints
- Dev environment exposes server endpoints under `notes/api/` (Vite + adapter or local serverless emulator recommended for testing).
- Ensure `GOOGLE_STUDIO_API_KEY` is set for AI endpoints to call Gemini.

---

## How to use the AI features

- Summarize a whole note: click AI → Summarize Note (saves an AI summary entry).
- Summarize selection: select text in editor → AI actions → Summarize Selection.
- Extract tasks from a note: AI → Extract Tasks (saved to `users/{uid}/aiTasks`).
- Extract tasks from selection: select text → AI actions → Extract Tasks from Selection.
- Create a list from extracted tasks: open AI Responses panel → pick extraction → Create List (select which tasks to include).

Behavior notes
- Due dates: model resolves relative dates only if prompt includes a current date context (today). If no date/relative phrase present, no dueDate is added.
- Output size: endpoints are tuned to safely handle ~15k input chars with `maxOutputTokens=1000`. For very large notes, extraction is chunked or truncated.

---

## Testing, metrics & recommended telemetry

Important events to instrument (Firebase Analytics or simple counters in Firestore):
- `ai_summary_created`
- `ai_extraction_created`
- `list_created_from_ai`
- `tags_autocreated`
- `task_created_manual`
- `task_created_ai`
- `task_toggled_completed`

Suggested metrics to include in README/resume
- AI adoption: # summaries/extractions per period
- Tasks auto‑created from AI: total & % of all new tasks
- Time savings: avg manual vs AI creation time (instrument timestamps)
- Accuracy: sample audit precision (e.g., 95% on a validation sample)

---

## Common issues & troubleshooting

- Stats mismatch (completed/created):
  - Ensure any flow that creates or completes tasks calls `updateUserStats` with Firestore `increment()` for created/completed and priorityCounts.
  - When creating lists from AI, update stats after `createToDoList`.
- Date off by one day:
  - Avoid `toISOString().split('T')[0]` for local dates — use `getLocalDateString(new Date())` to format local YYYY‑MM‑DD.
- AI output parsing failures:
  - Use bracket matching and code block stripping; prefer compact JSON schema in prompt to reduce token usage.
  - For large notes: chunk inputs or increase `maxOutputTokens` if account limits allow.
- Rapid toggle double counting:
  - Use the previous state (`wasCompleted`) before toggling to decide whether to `increment(1)` or `increment(-1)` for `taskStats.completed`.
  - Optionally disable the checkbox while update is in progress or debounce toggles.

---

## Security & privacy

- AI requests go through serverless endpoints; never expose API keys client‑side.
- AI artifacts (summaries/extractions) are saved to `users/{uid}` scoped collections and set to expire (example: 3 days) — adjust policy as needed.
- Consider offering users an opt‑out for storing AI outputs or an option to purge AI logs.

---

## Roadmap / future AI features

- Semantic search / embeddings + “Ask your notes”
- Natural language conversational assistant for quick task creation
- Smart reminders and calendar integration (Google Calendar)
- Meeting‑minutes extractor with action‑item assignment
- Proactive productivity suggestions based on activity patterns

---

## Contribution & contact

This repository is a personal / solo project. For suggestions, bug reports, or contributions, open an issue or reach out to the maintainer (owner of this repo). When contributing:
- Follow TypeScript types in `src/types`
- Run lint and basic unit checks (if added)
- Add telemetry when changing AI flows

---

## License

MIT — see LICENSE file (or replace per your preference).

---

Thank you for checking out Notizen. This README aims to be a concise owner’s guide for maintenance, extension, and onboarding reviewers (recruiters / product folks / contributors). If you want, I can also produce:
- A short one‑page product spec for interviews, or
- A step‑by‑step deployment + CI
