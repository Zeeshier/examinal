# 1. Navigate to frontend directory
cd examinal-frontend

# 2. Install dependencies
npm install

# 3. Start dev server (proxies /api to backend at :8000)
npm run dev

# 4. Open http://localhost:3000

# 5. Complete Page & API Integration Map

| Page | Route | Backend Endpoints Used |
| --- | --- | --- |
| Login | /login | POST /api/auth/login |
| Register | /register | POST /api/auth/register |
| Dashboard | / | GET /api/admin/stats, GET /api/courses/, GET /api/exams/, GET /api/submissions/my/all |
| User Management | /users | GET /api/users/, PATCH /api/users/:id, DELETE /api/users/:id |
| Activity Logs | /activity-logs | GET /api/admin/activity-logs |
| Course List | /courses | GET /api/courses/, POST /api/courses/, DELETE /api/courses/:id |
| Course Detail | /courses/:id | GET /api/courses/:id, GET /api/exams/, GET /api/courses/:id/students, POST /api/courses/:id/enroll, DELETE /api/courses/:id/enroll/:sid |
| Content Manager | /courses/:id/content | GET /api/content/documents/:id, POST /api/content/upload/:id, POST /api/content/ingest/:id, DELETE /api/content/documents/:id |
| Exam List | /exams | GET /api/exams/, GET /api/courses/, POST /api/exams/, DELETE /api/exams/:id |
| Exam Builder | /exams/:id/build | GET /api/exams/:id, GET /api/questions/exam/:id, POST /api/exams/:id/publish, POST /api/exams/:id/unpublish, POST /api/exams/:id/assign-all |
| Question Manager | /exams/:id/questions | GET /api/questions/exam/:id, POST /api/questions/, PATCH /api/questions/:id, DELETE /api/questions/:id, POST /api/questions/generate |
| Exam Taking | /exam/:id/take | GET /api/exams/:id, GET /api/exams/:id/questions-student, POST /api/submissions/start, POST /api/submissions/:id/autosave, POST /api/submissions/:id/submit, POST /api/submissions/activity |
| Grading Panel | /exams/:id/grading | GET /api/submissions/exam/:id, POST /api/grading/auto/:id, POST /api/grading/auto/exam/:id, GET /api/submissions/:id, PATCH /api/grading/manual/:id |
| My Results | /my-results | GET /api/submissions/my/all |
| Result Detail | /results/:id | GET /api/submissions/:id, GET /api/exams/:id/questions-student |
| Exam Analytics | /exams/:id/analytics | GET /api/analytics/exam/:id, GET /api/analytics/exam/:id/questions |
| Student Performance | /performance | GET /api/analytics/student/:id |
| Course Analytics | /courses/:id/analytics | GET /api/analytics/course/:id |