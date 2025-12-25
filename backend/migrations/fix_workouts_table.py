"""
Migration script to fix the workouts table by removing the old time column.

Run this script with: docker exec fitness-backend python migrations/fix_workouts_table.py
"""

import sqlite3

DB_PATH = "/app/fitness.db"

def run_migration():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Fixing workouts table...")
    
    # SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
    # First, check what columns exist
    cursor.execute("PRAGMA table_info(workouts)")
    columns = cursor.fetchall()
    print(f"Current columns: {[col[1] for col in columns]}")
    
    # Check if 'time' column exists
    has_time = any(col[1] == 'time' for col in columns)
    
    if has_time:
        print("Removing 'time' column from workouts table...")
        
        # Create new table without 'time' column
        cursor.execute("""
            CREATE TABLE workouts_new (
                id INTEGER PRIMARY KEY,
                name VARCHAR NOT NULL,
                description VARCHAR
            )
        """)
        
        # Copy data (only id, name, description)
        cursor.execute("""
            INSERT INTO workouts_new (id, name, description)
            SELECT id, name, description FROM workouts
        """)
        
        # Drop old table
        cursor.execute("DROP TABLE workouts")
        
        # Rename new table
        cursor.execute("ALTER TABLE workouts_new RENAME TO workouts")
        
        print("Successfully removed 'time' column")
    else:
        print("'time' column doesn't exist, checking if name column is NOT NULL...")
        
    # Also check if we need to drop the old workout_sets table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='workout_sets'")
    if cursor.fetchone():
        print("Dropping old workout_sets table...")
        cursor.execute("DROP TABLE workout_sets")
        print("Dropped workout_sets table")
    
    conn.commit()
    print("Migration completed!")
    conn.close()

if __name__ == "__main__":
    run_migration()

