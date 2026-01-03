"""
Migration script to add progress_pictures table
Run this script to add the progress_pictures table to an existing database.
"""
import sqlite3
import os

# Get the database path (relative to this script's location)
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'fitness.db')

def migrate():
    print(f"Connecting to database at: {os.path.abspath(DB_PATH)}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if progress_pictures table exists
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='progress_pictures'
    """)
    
    if cursor.fetchone():
        print("Table 'progress_pictures' already exists. Skipping migration.")
        conn.close()
        return
    
    print("Creating progress_pictures table...")
    
    cursor.execute("""
        CREATE TABLE progress_pictures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            log_entry_id INTEGER NOT NULL,
            label TEXT,
            filename TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            FOREIGN KEY (log_entry_id) REFERENCES log_entries(id) ON DELETE CASCADE
        )
    """)
    
    # Create index for faster queries by log_entry_id
    cursor.execute("""
        CREATE INDEX ix_progress_pictures_log_entry_id 
        ON progress_pictures(log_entry_id)
    """)
    
    conn.commit()
    print("Migration completed successfully!")
    
    # Verify the table was created
    cursor.execute("SELECT sql FROM sqlite_master WHERE name='progress_pictures'")
    result = cursor.fetchone()
    if result:
        print(f"\nTable schema:\n{result[0]}")
    
    conn.close()

if __name__ == "__main__":
    migrate()

