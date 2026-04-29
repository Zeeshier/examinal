import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from app.database import engine, Base
# Import models to register them with Base
from app.models import (
    user, course, content, exam, question, submission, activity_log,
    enrollment_request, message
)

try:
    print("Attempting to create tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")
except Exception as e:
    print(f"Error creating tables: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
