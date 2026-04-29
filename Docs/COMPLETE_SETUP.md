# Complete Setup & Run Guide — Examinal

Follow every step exactly in order.

## Step 1: Project Folder Structure
```Bash
mkdir examinal
cd examinal
mkdir examinal-backend
mkdir examinal-frontend
```

## Step 2: Backend Setup
```Bash
cd examinal-backend
### 2.1 Create Virtual Environment
python -m venv venv
```
Activate it:

```Bash
# Windows (PowerShell)
.\venv\Scripts\Activate.ps1
```

### 2.2 Create .env File
Place this in `examinal-backend/.env`:

```bash
APP_NAME=Examinal
APP_VERSION=2.0.0
DEBUG=true
SECRET_KEY=a1b2c3d4e5f6789012345678abcdef0123456789abcdef0123456789abcdef01
ALGORITHM=HS256

# MySQL (XAMPP) Configuration
DATABASE_URL=mysql+pymysql://root:@localhost:3306/examinal

# NVIDIA AI Stack
NVIDIA_API_KEY=nvapi-XXXX-YOUR-KEY-HERE
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
LLM_PROVIDER=nvidia
NVIDIA_LLM_MODEL=nvidia/nemotron-3-nano-30b-a3b
NVIDIA_EMBED_MODEL=nvidia/llama-3.2-nv-embedqa-1b-v2
USE_RERANKER=true
NVIDIA_RERANK_MODEL=nvidia/llama-nemotron-rerank-1b-v2

# Storage
UPLOAD_DIR=uploads
VECTOR_STORE_DIR=vector_store_data
MAX_UPLOAD_SIZE_MB=50
```

### 2.3 Install Dependencies
```Bash
pip install -r requirements.txt
```

### 2.4 Initialize MySQL Database
**Important:** Ensure MySQL is started in your **XAMPP Control Panel**. Then run:

```Bash
# 1. Create the database
python -c "import pymysql; conn = pymysql.connect(host='localhost', user='root', password=''); cursor = conn.cursor(); cursor.execute('CREATE DATABASE IF NOT EXISTS examinal'); conn.close(); print('Database ensured.')"

# 2. Create tables and seed admin
python -c "
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.utils.security import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

if not db.query(User).filter(User.username == 'admin').first():
    db.add(User(
        email='admin@examinal.com',
        username='admin',
        hashed_password=hash_password('admin123'),
        full_name='System Admin',
        role='admin',
    ))
    db.commit()
    print('Admin created -> username: admin | password: admin123')

if not db.query(User).filter(User.username == 'instructor1').first():
    db.add(User(
        email='instructor@examinal.com',
        username='instructor1',
        hashed_password=hash_password('instructor123'),
        full_name='Dr. Sarah Johnson',
        role='instructor',
    ))
    db.commit()
    print('Instructor created -> username: instructor1 | password: instructor123')

db.close()
"
```

Expected output:
```
Admin created -> username: admin | password: admin123
Instructor created -> username: instructor1 | password: instructor123
Student created -> username: student1 | password: student123
```

Windows: venv\Scripts\activate
### 2.6 Start Backend Server
```Bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```
### 2.7 Verify Backend Works
Open a browser and go to:
```
http://localhost:8000
You should see:
```
{"status": "healthy", "app": "Examinal", "version": "1.0.0"}
```
Then check the API docs:
```

http://localhost:8000/docs
You should see the full Swagger UI with all endpoints.

Keep this terminal open and running.

## Step 3: Frontend Setup
Open a NEW terminal window/tab, then:
```Bash
cd examinal/examinal-frontend
```
### 3.1 Initialize and Install
```Bash
npm install
```
Expected output should end with something like:
```
added 250 packages in 15s
```
If you see any vulnerabilities warning, ignore them for development.

### 3.2 Verify .env exists
Make sure examinal-frontend/.env contains:
```
VITE_API_URL=http://localhost:8000
```
### 3.3 Start Frontend Server
```Bash
npm run dev
```
Expected output:
```
  VITE v6.0.7  ready in 500ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```
### 3.4 Open the App
```
http://localhost:3000
```
## Step 4: Test the Complete Flow
### 4.1 Login as Admin
```
Username: admin
Password: admin123
```
You should see the Admin Dashboard with stats cards showing:
```
Total Users: 3
Total Courses: 0
Total Exams: 0
Submissions: 0
```
### 4.2 Login as Instructor (different browser or incognito)
```
Username: instructor1
Password: instructor123
```
Create a course:
```
Click My Courses in sidebar
Click New Course button
Fill in:
Title: Data Structures and Algorithms
Code: CS201
Description: Fundamental data structures and algorithm design
Click Create
```
Upload content:
```
Click on the course card → Content button
Upload any PDF file (course notes, textbook chapter, etc.)
After upload, click the Index button on the document
Wait for it to show "indexed" status
Create an exam:
```
Go to My Exams → New Exam
Select course CS201
Title: Midterm Exam
Duration: 30 min
Click Create Exam
Generate AI questions:
```
Click Manage on the exam → click Questions card
Click Generate with AI
Set: 5 questions, MCQ, medium difficulty
Click Generate — wait 10-15 seconds
Questions appear automatically from your uploaded content
Publish and assign:
```
Go back to exam builder (click browser back or navigate)
Click Assign Students card — assigns all enrolled students
Click Publish button
```
Enroll the student first:
```
Go to My Courses → click CS201 → in Students panel click Enroll
Enter Student ID: 3 (the student1 user)
Then go back to exam → Assign Students

### 4.3 Login as Student (another browser/incognito)

Username: student1
Password: student123
```
Go to My Exams — you should see "Midterm Exam"
```
Click Start → Exam taking page opens
Answer questions — notice:
Timer running top right
Question navigator on the left
Copy/paste/right-click blocked
Tab switches logged
Click Submit
Go to My Results — see your submission
4.4 Grade as Instructor
Switch to instructor browser
Go to My Exams → click Manage on Midterm → Grading card
Click Auto-Grade All
View results — click eye icon to see detail
Override any score manually if needed
4.5 View Analytics
As instructor, go to exam → Analytics card
See score distribution chart, pass rate, question-level analysis
Go to My Courses → course → Analytics for course-wide stats
Troubleshooting
Backend won't start
Error	Fix
ModuleNotFoundError: No module named 'app'	Make sure you're running from examinal-backend/ directory
No module named 'pdfplumber'	Run pip install pdfplumber
Address already in use :8000	Kill existing process: lsof -i :8000 then kill <PID>, or use --port 8001
sqlite3.OperationalError	Delete examinal.db and restart — tables recreate automatically
Frontend won't start
Error	Fix
npm: command not found	Install Node.js from https://nodejs.org (v18+)
Port 3000 already in use	Change port in vite.config.js under server.port
Cannot find module	Delete node_modules and run npm install again
API calls fail (Network Error)
Error	Fix
CORS error in console	Backend must be running on port 8000
401 Unauthorized	Token expired — login again
422 Unprocessable Entity	Check request body format in browser DevTools → Network tab
Proxy not working	Ensure vite.config.js has proxy config and backend is on :8000
AI Generation fails
Error	Fix
openai.AuthenticationError	Check OPENAI_API_KEY in .env is valid
No course content found	Upload AND index (click Index button) content before generating
Timeout on generation	Normal for first run — embedding model downloads (~80MB first time)
Sentence Transformers first-run download
The first time you ingest a document, the embedding model downloads automatically (~80MB). You'll see:

text

Downloading model all-MiniLM-L6-v2...
This only happens once. Subsequent runs use the cached model.

Both Terminals Summary
Terminal 1 — Backend:

Bash

cd examinal/examinal-backend
source venv/bin/activate        # activate virtualenv
uvicorn main:app --reload --host 0.0.0.0 --port 8000
Terminal 2 — Frontend:

Bash

cd examinal/examinal-frontend
npm run dev
Open browser:

text

http://localhost:3000
Test Credentials
Role	Username	Password
Admin	admin	admin123
Instructor	instructor1	instructor123
Student	student1	student123
Quick Verification Checklist
text

✅ Backend running  → http://localhost:8000 returns {"status":"healthy"}
✅ API docs visible → http://localhost:8000/docs shows Swagger UI
✅ Frontend running → http://localhost:3000 shows login page
✅ Login works      → Enter admin/admin123 → Dashboard appears
✅ Courses work     → Create a course as instructor
✅ Upload works     → Upload PDF → Index it → status shows "indexed"
✅ AI Generation    → Generate questions → questions appear
✅ Exam flow        → Publish exam → student takes it → grading works
✅ Analytics        → Charts render with real data after grading