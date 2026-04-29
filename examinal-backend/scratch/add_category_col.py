import pymysql
import os

# Database connection details (guessing from common patterns or checking config)
# I'll try to find the DB URL in the app config
from sqlalchemy import text
from app.database import engine

def add_category_column():
    try:
        with engine.connect() as connection:
            # Check if column exists
            result = connection.execute(text("SHOW COLUMNS FROM exams LIKE 'category'"))
            if not result.fetchone():
                print("Adding 'category' column to 'exams' table...")
                connection.execute(text("ALTER TABLE exams ADD COLUMN category VARCHAR(100) DEFAULT 'General'"))
                connection.commit()
                print("Column added successfully.")
            else:
                print("'category' column already exists.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_category_column()
