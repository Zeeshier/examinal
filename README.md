# Examinal

Examinal is an AI-powered assessment platform for administrators, instructors, and students. It combines course management, document-based question generation, online exams, automated grading, instructor review, messaging, and performance analytics.

The software consists of a React frontend and a FastAPI backend, both currently identified as version **2.0.0**. This guide describes the implementation in this workspace; older component READMEs and academic documents may describe earlier behavior.

## Contents

- [Features and roles](#features-and-roles)
- [Architecture and stack](#architecture-and-stack)
- [Workspace layout](#workspace-layout)
- [Local setup](#local-setup)
- [Configuration reference](#configuration-reference)
- [Assessment and AI workflows](#assessment-and-ai-workflows)
- [Frontend routes](#frontend-routes)
- [API overview](#api-overview)
- [Testing](#testing)
- [Deployment and maintenance](#deployment-and-maintenance)
- [Implementation limitations](#implementation-limitations)
- [Troubleshooting](#troubleshooting)
- [Further documentation](#further-documentation)

## Features and roles

| Role | Main workflows |
| --- | --- |
| Administrator | Manage users, inspect platform statistics and activity logs, review exam integrity events, handle contact inquiries, and access instructor tools. Some operations impose additional role or ownership restrictions. |
| Instructor | Manage courses and enrollment; upload/index materials; create manual or AI-generated questions; build, publish, and assign exams; approve access requests; grade and override scores; inspect analytics. |
| Student | View courses and assigned exams; browse published exams and request access; take exams; view results and performance; communicate through in-app messages. |

Implemented capabilities include:

- Public landing, features, about, team, and contact pages.
- Student/instructor registration, JWT authentication, refresh-token rotation, logout, password changes, and email password reset. Public registration rejects administrator accounts.
- Password strength validation and a 15-minute account lockout after five consecutive failed logins.
- MCQ, short-answer, and descriptive questions with difficulty, marks, explanations, topics, and optional rubrics.
- Exam categories, schedule settings, attempt limits, publication controls, question-shuffling settings, and student assignments.
- Browser exam controls: fullscreen, countdown, autosave every 30 seconds, activity logging, clipboard/context-menu restrictions, and auto-submission after three counted violations.
- MCQ scoring, AI evaluation of written responses, low-confidence review, and audited manual score overrides.
- Exam, question, student, and course analytics, plus in-app messaging and administrator contact replies.

## Architecture and stack

```mermaid
flowchart LR
    UI[React frontend] -->|HTTP REST /api| API[FastAPI backend]
    API --> SQL[(SQLite or MySQL-compatible database)]
    API --> Files[Uploaded PDF / DOCX / PPTX files]
    API --> Chroma[(Persistent ChromaDB)]
    API --> NVIDIA[NVIDIA embeddings / reranking / LLM]
    API --> Fallback[Optional OpenAI or Gemini LLM]
    API --> SMTP[SMTP email]
```

| Layer | Implementation |
| --- | --- |
| Frontend | React 18, React Router 7, Vite 6, Tailwind CSS 3, Axios |
| UI and charts | Framer Motion, Lucide, React Hot Toast, Recharts, Three.js |
| API | FastAPI, Uvicorn, Pydantic 2, pydantic-settings |
| Relational storage | SQLAlchemy 2; SQLite by default; PyMySQL for MySQL-compatible connections |
| Authentication | python-jose JWTs, bcrypt, database-backed refresh/reset tokens |
| Document extraction | pdfplumber, python-docx, python-pptx |
| Retrieval | LangChain text splitting, ChromaDB, NVIDIA embedding/reranking clients |
| AI generation/grading | NVIDIA NIM through an OpenAI-compatible client; optional OpenAI/Gemini providers |
| Schema tooling | Alembic revisions and startup table creation/compatibility alterations |
| System testing | pytest and httpx against a running backend |

SQL stores users, courses/enrollment, documents/passages, exams/assignments/questions, submissions/answers, score overrides, access requests, messages, contacts, activity logs, login attempts, and authentication tokens. Uploaded files live under `uploads/`; embeddings live under `vector_store_data/`, in course-specific collections named `course_<course_id>`.

## Workspace layout

```text
examinal/
|-- README.md                     Main project guide
|-- examinal-backend/
|   |-- main.py                   API entry point and startup lifecycle
|   |-- app/
|   |   |-- config.py             Environment settings
|   |   |-- database.py           SQLAlchemy engine and sessions
|   |   |-- dependencies.py       Authentication and role dependencies
|   |   |-- models/               Relational entities
|   |   |-- schemas/              Request/response validation
|   |   |-- routers/              REST endpoints
|   |   |-- services/             Auth, ingestion, retrieval, AI, analytics
|   |   |-- middleware/           Activity logging and limiter code
|   |   `-- utils/                Parsing, email, security, answer maintenance
|   |-- alembic/                  Existing migration revisions
|   |-- requirements.txt          Python dependencies
|   |-- Dockerfile                Backend container
|   |-- seed_admin.py             Development account seeding
|   |-- reindex_all.py            Rebuild vector indexes
|   |-- scratch/                  One-off migration/debug/reset utilities
|   |-- uploads/                  Uploaded materials
|   |-- vector_store_data/        Persistent Chroma data
|   `-- examinal.db               Default SQLite database
|-- examinal-frontend/
|   |-- src/pages/                Public and authenticated screens
|   |-- src/components/           Shared UI and route protection
|   |-- src/layouts/              Public, auth, and dashboard layouts
|   |-- src/context/AuthContext.jsx
|   |-- src/api/axios.js           API URL, tokens, refresh interception
|   |-- public/                   Logos, team images, visual assets
|   `-- package.json              Dependencies and scripts
|-- examinal-system-tests/        Live API tests and report generator
|-- examinal-test/                Manual cases, defects, evidence documents
|-- Docs/                         Architecture, setup, RAG notes, figures
|-- FYP_DOCS/                     Academic chapters and testing reports
|-- Videos/                       Recorded demonstrations
|-- backup_restore.ps1            SQLite/files/vector backup and restore
|-- locustfile.py                 Load-test scaffold requiring updates
|-- generate_assignment4.py       Assignment report generation
`-- system_test_results.md        Historical test summary
```

## Local setup

### Prerequisites

- Python 3.12, matching the backend container baseline.
- Node.js and npm compatible with Vite 6; Node.js 22 is a suitable development baseline.
- A NVIDIA API key and outbound connectivity for default embeddings and AI workflows. Authentication, course management, and manual exam authoring do not need AI requests.
- Optional MySQL server; SQLite is the default.
- SMTP credentials for password-reset and contact-reply email delivery.

Commands below use **PowerShell**. Run backend commands from `examinal-backend`: `.env`, SQLite, uploads, and vector paths are relative to the working directory.

### 1. Install the backend

```powershell
Set-Location F:\examinal\examinal-backend
py -3.12 -m venv venv
.\venv\Scripts\python.exe -m pip install --upgrade pip
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

Using the virtual environment executable directly avoids activation-policy issues. Recreate the workspace's local `venv/` when setting up another machine.

### 2. Configure the backend

Create or edit `examinal-backend/.env`. **There is no `.env.example` in this workspace.** Preserve an existing configuration rather than overwriting it. A minimal configuration is:

```dotenv
DEBUG=false
SECRET_KEY=replace-with-a-generated-random-secret
DATABASE_URL=sqlite:///./examinal.db
FRONTEND_URL=http://localhost:3000
LLM_PROVIDER=nvidia
NVIDIA_API_KEY=replace-with-your-nvidia-api-key
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_LLM_MODEL=nvidia/nemotron-3-nano-30b-a3b
EMBEDDING_PROVIDER=nvidia_api
NVIDIA_EMBED_MODEL=nvidia/llama-nemotron-embed-1b-v2
USE_RERANKER=true
NVIDIA_RERANK_MODEL=nvidia/llama-nemotron-rerank-1b-v2
UPLOAD_DIR=uploads
VECTOR_STORE_DIR=vector_store_data
MAX_UPLOAD_SIZE_MB=50
```

Generate the secret with:

```powershell
.\venv\Scripts\python.exe -c "import secrets; print(secrets.token_hex(64))"
```

The backend exits if `DEBUG=false` and `SECRET_KEY` remains `CHANGE-ME`. `DEBUG` also accepts `dev`/`development` and `prod`/`production` labels.

For MySQL, create the database and change the URL, for example:

```dotenv
DATABASE_URL=mysql+pymysql://examinal_user:your_password@localhost:3306/examinal
```

URL-encode credentials when necessary. Remote MySQL connections enable TLS using `certifi` or `DB_SSL_CA`. `create_db.py` handles simple MySQL URLs; use database administration tools for complex credentials or remote TLS setup.

### 3. Start the API

```powershell
.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Startup creates storage directories, attempts compatibility alterations, creates missing tables, and runs token/answer cleanup. It requires a reachable database with schema-write permissions.

- Health: <http://localhost:8000/> (the route is `/`, not `/health`)
- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>
- OpenAPI schema: <http://localhost:8000/openapi.json>

### 4. Seed development accounts

After API startup initializes the schema, run in another terminal:

```powershell
Set-Location F:\examinal\examinal-backend
.\venv\Scripts\python.exe seed_admin.py
```

The script creates missing usernames and leaves existing users unchanged:

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `admin123` | Administrator |
| `instructor1` | `instructor123` | Instructor |

These are development credentials; change them before exposing an installation. Seeding bypasses registration validation. New registrations require at least eight characters, uppercase, lowercase, a digit, and a special character.

### 5. Start the frontend

```powershell
Set-Location F:\examinal\examinal-frontend
npm ci
npm run dev
```

Open <http://localhost:3000>. `/` redirects guests to `/home` and signed-in users to `/dashboard`. If port 3000 is occupied, use the URL Vite prints and adjust `FRONTEND_URL` accordingly.

Axios defaults to `http://localhost:8000`. Override it in `examinal-frontend/.env` and restart Vite:

```dotenv
VITE_API_URL=http://localhost:8000
```

Use the backend origin without `/api`; page requests already include `/api/...`. Vite also has a development `/api` proxy to port 8000, but the default Axios URL sends requests directly to the backend.

## Configuration reference

Defaults come from [app/config.py](examinal-backend/app/config.py); environment variables and `.env` override them.

| Setting | Default / purpose |
| --- | --- |
| `APP_NAME`, `APP_VERSION`, `DEBUG` | `Examinal`, `2.0.0`, `false`; debug enables SQL logging |
| `SECRET_KEY`, `ALGORITHM` | JWT signing secret; `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS` | `60` minutes, `7` days |
| `DATABASE_URL` | `sqlite:///./examinal.db` |
| `FRONTEND_URL` | `http://localhost:3000`; password-reset link origin |
| `LLM_PROVIDER` | `nvidia`; also `openai` or `gemini` |
| `NVIDIA_API_KEY`, `NVIDIA_BASE_URL` | NVIDIA credentials and integration endpoint |
| `NVIDIA_LLM_MODEL` | `nvidia/nemotron-3-nano-30b-a3b` |
| `LLM_TEMPERATURE`, `LLM_MAX_TOKENS` | `0.4`, `8192` |
| `FALLBACK_LLM_PROVIDER` | `openai`; used when a NVIDIA LLM request fails |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Optional provider credentials; `gpt-4o-mini` |
| `GOOGLE_API_KEY`, `GEMINI_MODEL` | Optional Gemini credentials; `gemini-1.5-flash` |
| `EMBEDDING_PROVIDER`, `NVIDIA_EMBED_MODEL` | `nvidia_api`, `nvidia/llama-nemotron-embed-1b-v2` |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2`; local embedding branch |
| `USE_RERANKER`, `NVIDIA_RERANK_MODEL` | `true`, `nvidia/llama-nemotron-rerank-1b-v2` |
| `RETRIEVAL_TOP_K`, `RERANK_TOP_K` | `25` candidates, `6` reranked passages |
| `CHUNK_SIZE`, `CHUNK_OVERLAP` | `600`, `150` characters |
| `GRADING_MODE` | `multi_pass`; other values use single-pass descriptive grading |
| `GRADING_CONFIDENCE_THRESHOLD`, `ENABLE_RUBRIC_GRADING` | `0.7`, `true` |
| `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` | SMTP credentials and sender; configure your own account |
| `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USE_TLS` | `smtp.gmail.com`, `587`, `true` |
| `UPLOAD_DIR`, `VECTOR_STORE_DIR`, `MAX_UPLOAD_SIZE_MB` | `uploads`, `vector_store_data`, `50` |
| `VITE_API_URL` | Frontend-only backend origin; embedded at build time |

Model names are repository defaults, not guarantees of provider availability. LLM fallback needs credentials for the selected provider and does not provide fallback embeddings.

## Assessment and AI workflows

1. **Create a course** and enroll students through the course tools.
2. **Upload teaching materials**, then trigger ingestion. Upload and ingestion are separate operations.
3. **Build an exam** with duration, marks, category, schedule, attempts, and result settings. Add manual questions or generate questions by type, difficulty, and topic.
4. **Review and publish.** Publication requires questions and an exact match between their summed marks and the configured exam total.
5. **Grant access** through individual/all-enrolled assignments, or approve students' exam requests with access keys.
6. **Take the exam.** Starting creates or resumes an `in_progress` submission; the browser handles countdown, controls, and periodic autosave.
7. **Submit and grade.** Submission changes status to `submitted`; an instructor invokes individual/batch grading, which sets `graded` and stores scores, feedback, and confidence. Review low-confidence answers and override scores where needed.
8. **Inspect results and analytics** through student result/performance and instructor exam/course pages.

### Retrieval and generation

The ingestion service extracts PDF/DOCX/PPTX text and tables, splits text with `RecursiveCharacterTextSplitter`, and stores SQL passages plus NVIDIA embeddings in Chroma. PDF pages and PPTX slides retain page metadata; DOCX text is combined without page numbers.

Generation embeds a query, retrieves passages using cosine distance, optionally reranks them, then prompts the LLM and validates generated question data before saving it. MCQ, short-answer, descriptive, and mixed batches are supported. When retrieval yields no useful context, generation can fall back to general knowledge; review these questions for course alignment.

### Grading

- **MCQs:** Normalized answer-key comparison without an LLM request.
- **Short answers:** LLM evaluation against model answers and extracted key terms.
- **Descriptive answers:** Rubric/model-answer evaluation; default multi-pass grading performs an initial score and a second review, then combines scores using confidence.
- **Provider failures:** Written-answer grading falls back to keyword overlap with low confidence.
- **Human review:** Low-confidence queries and manual overrides are exposed in the API/UI. Overrides recalculate totals and create audit records.

Written-answer grading uses question/model-answer/rubric prompts; it does not retrieve fresh Chroma context for each answer.

## Frontend routes

Routes and frontend role guards are defined in [src/App.jsx](examinal-frontend/src/App.jsx). Backend endpoints apply their own authorization.

| Audience | Routes |
| --- | --- |
| Public | `/home`, `/features`, `/about`, `/team`, `/contact`, `/login`, `/register`, `/forgot-password`, `/reset-password` |
| Authenticated | `/dashboard`, `/courses`, `/courses/:courseId`, `/performance`, `/performance/:studentId`, `/messages`, `/change-password`, `/exams` |
| Administrator | `/users`, `/contact-messages`, `/activity-logs` |
| Instructor/admin | `/courses/:courseId/content`, `/courses/:courseId/analytics`, `/exams/:examId/build`, `/exams/:examId/questions`, `/exams/:examId/grading`, `/exams/:examId/analytics`, `/enrollment-requests` |
| Student | `/browse-exams`, `/my-results`, `/results/:submissionId` |
| Authenticated exam screen | `/exam/:examId/take` (without dashboard sidebar) |

## API overview

The backend registers 13 router groups under `/api`. Consult live Swagger/OpenAPI for complete payload definitions, permissions, and parameter placement.

| Prefix | Representative operations |
| --- | --- |
| `/api/auth` | Register, login, refresh/logout, current user, forgot/reset/change password |
| `/api/users` | User listing, lookup, updates, deletion |
| `/api/courses` | CRUD; `/{id}/search-students`, `/{id}/enroll`, `/{id}/students` |
| `/api/content` | `POST /upload/{course_id}`, `POST /ingest/{document_id}`, documents/passages listing and deletion |
| `/api/questions` | CRUD; `GET /exam/{exam_id}`, `POST /generate` |
| `/api/exams` | CRUD; `/browse`; publish/unpublish; assign/assign-all; assignments; student question view |
| `/api/submissions` | `POST /start`, `POST /{id}/autosave`, `POST /{id}/submit`, exam submissions, `/my/all`, `/activity` |
| `/api/grading` | `POST /auto/{submission_id}`, `POST /auto/exam/{exam_id}`, `PATCH /manual/{answer_id}`, `/low-confidence/{exam_id}`, `/config` |
| `/api/analytics` | Exam/question metrics, student performance, course analytics |
| `/api/admin` | `/stats`, `/activity-logs`, `/exam/{exam_id}/integrity` |
| `/api/enrollment-requests` | Create request; `/my`, `/pending`, `/exam/{exam_id}`; PATCH approval/rejection |
| `/api/messages` | Send, conversations/history, unread count, mark read |
| `/api/contact` | Public inquiry submission; administrator listing and replies |

Login uses `application/x-www-form-urlencoded` fields `username` and `password`; refresh uses a JSON body. Protected calls use `Authorization: Bearer <access_token>`. The frontend stores tokens in local storage and retries a failed authenticated request once after refreshing.

## Testing

The seven `examinal-system-tests/test_*.py` modules cover authentication, courses/enrollment, exam lifecycle, grading/results, analytics, communication/admin, and infrastructure. They call a **running backend**, and some create/modify data. Use a disposable development database.

Install pytest (not included in backend requirements), start the API, then run:

```powershell
Set-Location F:\examinal
.\examinal-backend\venv\Scripts\python.exe -m pip install pytest
$env:EXAMINAL_BASE_URL = "http://127.0.0.1:8000"
.\examinal-backend\venv\Scripts\python.exe -m pytest .\examinal-system-tests -v
```

[conftest.py](examinal-system-tests/conftest.py) expects `admin / admin123`, `systest_instructor / SysTest@123`, and `systest_student / SysTest@123`. The seeder only creates `admin` and `instructor1`; create the additional fixture accounts in the disposable installation or adjust fixture credentials.

Execute tests and regenerate Markdown, CSV, and JUnit reports with:

```powershell
.\examinal-backend\venv\Scripts\python.exe .\examinal-system-tests\run_tests_and_report.py
```

The saved [test summary](examinal-system-tests/results/test_summary.md) reports **73 passed tests on May 9, 2026**. This is historical evidence, not a fresh result for the current checkout or validation of AI quality, browser controls, or production security.

Frontend build and preview:

```powershell
Set-Location F:\examinal\examinal-frontend
npm run build
npm run preview
```

`package.json` provides no frontend test or lint scripts. `examinal-test/` contains manual plans, defect records, and evidence documents. `locustfile.py` is a scaffold whose assumed accounts and several endpoint names do not match current routers; adapt it before using load-test results.

## Deployment and maintenance

- The backend [Dockerfile](examinal-backend/Dockerfile) uses Python 3.12, a non-root user, and Uvicorn on `0.0.0.0` with `PORT` or 8000. Supply environment configuration and persistent storage for uploads, Chroma, and SQLite when used.
- `npm run build` produces `examinal-frontend/dist/`. Set `VITE_API_URL` before building, serve over HTTPS, and configure SPA fallback to `index.html`. The development proxy is not included in a static build.
- This workspace includes no Compose definition or complete automated deployment pipeline.
- Existing Alembic revisions modify an existing MySQL schema; the revision named "initial" does not create all tables. Do not treat `alembic upgrade head` as a verified fresh-database bootstrap. Review revisions and startup alterations against a backup before upgrading existing data.
- Startup cleanup removes expired authentication tokens and reconciles submission totals/duplicate answers; it is not a recurring background scheduler.

For the default SQLite layout, run the supplied backup utility **from the root with the backend stopped**:

```powershell
Set-Location F:\examinal
.\backup_restore.ps1 -Action backup
```

It archives `examinal.db`, `vector_store_data/`, and `uploads/` under `backups/`. Restore accepts `-Action restore -TargetArchive <zip-path>` and asks before overwriting. The script's process-stop step is simulated: stop the backend yourself. It does not back up MySQL or `.env`; handle those separately and keep SQL, files, and vectors from the same backup point.

`reindex_all.py` rebuilds indexed/failed documents after an embedding-model change. It deletes the configured vector-store directory and replaces passage records: review it, back up data, and stop the API before use. `scratch/` contains one-off and destructive database utilities rather than normal setup steps.

## Implementation limitations

Source review identified these constraints:

- **Browser enforcement:** Fullscreen, timing, and violation handling depend on the client. Submission endpoints do not independently enforce the configured schedule or elapsed duration. These controls are not a secure lockdown browser.
- **Authorization consistency:** Many endpoints check role/ownership, but some exam reads allow any authenticated user, and exam-update logic explicitly requires the instructor role. UI access does not imply identical administrator backend permissions.
- **Results visibility:** `show_results` and `results_published` exist, but submission-detail access does not gate students on these flags. Current routers have no dedicated result-release workflow.
- **CORS and rate limiting:** `main.py` permits any origin through `allow_origin_regex=".*"` with credentials. General rate-limiter middleware exists but is not registered; authentication lockout controls are separate.
- **Extraction:** PDF text/table parsing has no OCR. Image-only scans can yield no useful passages.
- **Local embeddings:** Local branches import `sentence_transformers`, intentionally absent from requirements; extra dependencies and model setup are necessary.
- **Email:** Delivery is skipped without `MAIL_PASSWORD`. The utility uses SMTP with optional STARTTLS; declared `MAIL_USE_SSL` is not implemented there.
- **Schema upgrades:** Startup swallows compatibility-alteration errors; existing schemas need explicit verification when models change.
- **Dependencies:** Backend requirements mix pinned/unpinned packages and duplicate `langchain-community`; frontend dependencies have a package lock. Installed local packages can differ from a fresh backend install.

These observations describe current behavior. This documentation update does not change application code or resolve these issues.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Backend exits before startup | Generate `SECRET_KEY`; check `.env` location and working directory. |
| Existing venv reports `No Python at ...` | Its original Python installation is missing. Install Python 3.12 and recreate the virtual environment; the bundled environment had this issue during the documentation review. |
| Database connection/missing-column error | Verify URL, availability, permissions, actual schema, and startup changes. |
| Frontend cannot reach API | Check port and `VITE_API_URL`; restart/rebuild after environment changes. |
| Generation/indexing fails | Check NVIDIA credentials, connectivity, model access, file text, and ingestion status. |
| LLM fallback also fails | Supply fallback credentials or select a configured primary provider. |
| Chroma dimension mismatch | Back up and rebuild embeddings consistently after changing models. |
| Publication rejected | Add questions and make their summed marks equal the exam total. |
| Student cannot start | Publish, assign or approve with matching access key, and check attempt limit. |
| Reset email absent | Configure SMTP credentials and `FRONTEND_URL`; inspect email logs. |
| Tests fail at login | Create fixture accounts and verify the disposable backend URL. |

## Further documentation

- [Architecture and storage overview](Docs/architecture_overview.md)
- [RAG implementation notes](Docs/rag_system_analysis.md)
- [Extended setup guide](Docs/COMPLETE_SETUP.md)
- [Documentation differences](Docs/documentation_differences_analysis.md)
- [Software requirements](FYP_DOCS/Chapter_2_Software_Requirements_Specifications.md)
- [System analysis and design](FYP_DOCS/Chapter_4_System_Analysis_and_Design.md)
- [User interface design](FYP_DOCS/Chapter_5_User_Interface_Design.md)
- [Manual testing document index](examinal-test/README.txt)
- [Historical automated test report](examinal-system-tests/results/test_results.md)

Use source code and live OpenAPI to resolve differences with historical documentation.
