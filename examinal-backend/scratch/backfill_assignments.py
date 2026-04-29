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
        # Get all approved enrollment requests
        res = conn.execute(text("SELECT exam_id, student_id FROM enrollment_requests WHERE status = 'approved'"))
        requests = res.fetchall()
        print(f"Found {len(requests)} approved requests.")

        count = 0
        for req in requests:
            exam_id, student_id = req
            
            # Check if assignment already exists
            check = conn.execute(text(
                "SELECT id FROM exam_assignments WHERE exam_id = :eid AND student_id = :sid"
            ), {"eid": exam_id, "sid": student_id})
            
            if not check.fetchone():
                print(f"Assigning student {student_id} to exam {exam_id}...")
                conn.execute(text(
                    "INSERT INTO exam_assignments (exam_id, student_id, assigned_at) VALUES (:eid, :sid, NOW())"
                ), {"eid": exam_id, "sid": student_id})
                count += 1
        
        conn.commit()
        print(f"Done! Created {count} new assignments.")
    except Exception as e:
        print(f"Error: {e}")
