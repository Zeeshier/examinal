import sqlite3
import os

db_path = r'f:\examinal\examinal-backend\examinal.db'
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("PRAGMA table_info(exams)")
        columns = [col[1] for col in cursor.fetchall()]
        print(f"Columns in 'exams' table: {columns}")
        
        if 'category' not in columns:
            print("Adding 'category' column...")
            cursor.execute("ALTER TABLE exams ADD COLUMN category VARCHAR(100) DEFAULT 'General'")
            conn.commit()
            print("'category' column added successfully.")
            
        if 'schedule_type' not in columns:
            print("Adding 'schedule_type' column...")
            cursor.execute("ALTER TABLE exams ADD COLUMN schedule_type VARCHAR(20) DEFAULT 'anytime'")
            conn.commit()
            print("'schedule_type' column added successfully.")
            
        print("Final column list:", [col[1] for col in cursor.execute("PRAGMA table_info(exams)").fetchall()])
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
