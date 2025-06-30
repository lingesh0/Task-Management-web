import sqlite3

DB_PATH = 'task_management.db'  # Update if your DB file is named differently

def column_exists(cursor, table, column):
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Add reminder column if not exists
    if not column_exists(cursor, 'tasks', 'reminder'):
        cursor.execute("ALTER TABLE tasks ADD COLUMN reminder DATETIME")
        print("Added 'reminder' column to tasks table.")
    else:
        print("'reminder' column already exists.")
    # Add user_email column if not exists
    if not column_exists(cursor, 'tasks', 'user_email'):
        cursor.execute("ALTER TABLE tasks ADD COLUMN user_email TEXT")
        print("Added 'user_email' column to tasks table.")
    else:
        print("'user_email' column already exists.")
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate() 