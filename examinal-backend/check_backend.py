import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

try:
    print("Attempting to import app.routers...")
    from app.routers import (
        auth, users, courses, content as content_router,
        questions, exams, submissions, grading, analytics, admin,
        enrollment_requests, messages
    )
    print("Successfully imported all routers.")
    
    print("Attempting to import main.app...")
    from main import app
    print("Successfully imported main app.")
except Exception as e:
    print(f"Error during import: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
