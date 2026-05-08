import pymysql
from app.config import settings

def fix_db_schema():
    # Parse DATABASE_URL
    url = settings.DATABASE_URL
    parts = url.split("://")[1].split("/")
    base_url = parts[0]
    db_name = parts[1]

    auth_host = base_url.split("@")
    if len(auth_host) > 1:
        user_pass = auth_host[0].split(":")
        user = user_pass[0]
        password = user_pass[1] if len(user_pass) > 1 else ""
        host_port = auth_host[1].split(":")
        host = host_port[0]
        port = int(host_port[1]) if len(host_port) > 1 else 3306
    else:
        user = "root"
        password = ""
        host_port = auth_host[0].split(":")
        host = host_port[0]
        port = int(host_port[1]) if len(host_port) > 1 else 3306

    try:
        conn = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=db_name
        )
        cursor = conn.cursor()
        
        # Add 'category' column if not exists
        try:
            cursor.execute("ALTER TABLE exams ADD COLUMN category VARCHAR(100) DEFAULT 'General'")
            print("Added 'category' column to 'exams' table.")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("'category' column already exists.")
            else:
                print(f"Error adding 'category': {e}")

        # Add 'schedule_type' column if not exists
        try:
            cursor.execute("ALTER TABLE exams ADD COLUMN schedule_type VARCHAR(20) DEFAULT 'anytime'")
            print("Added 'schedule_type' column to 'exams' table.")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("'schedule_type' column already exists.")
            else:
                print(f"Error adding 'schedule_type': {e}")

        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    fix_db_schema()
