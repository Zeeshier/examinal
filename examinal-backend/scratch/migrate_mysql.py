import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found in .env")
    exit(1)

print(f"Connecting to: {db_url}")
engine = create_engine(db_url)

with engine.connect() as conn:
    try:
        # Get existing columns
        res = conn.execute(text("SHOW COLUMNS FROM exams"))
        columns = [row[0] for row in res.fetchall()]
        print(f"Current columns: {columns}")

        if 'category' not in columns:
            print("Adding 'category'...")
            conn.execute(text("ALTER TABLE exams ADD COLUMN category VARCHAR(100) DEFAULT 'General'"))
        
        if 'schedule_type' not in columns:
            print("Adding 'schedule_type'...")
            conn.execute(text("ALTER TABLE exams ADD COLUMN schedule_type VARCHAR(20) DEFAULT 'anytime'"))
        
        conn.commit()
        print("Done!")
    except Exception as e:
        print(f"Error: {e}")
