"""
Migration script to add stats_configurations table
Run this script to add the stats_configurations table to an existing database.
"""
import sqlite3
import os

# Get the database path (relative to this script's location)
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'fitness.db')

def migrate():
    print(f"Connecting to database at: {os.path.abspath(DB_PATH)}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if stats_configurations table exists
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='stats_configurations'
    """)
    
    if cursor.fetchone():
        print("Table 'stats_configurations' already exists. Skipping migration.")
        conn.close()
        return
    
    print("Creating stats_configurations table...")
    
    cursor.execute("""
        CREATE TABLE stats_configurations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            config TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
    """)
    
    conn.commit()
    print("Migration completed successfully!")
    
    # Verify the table was created
    cursor.execute("SELECT sql FROM sqlite_master WHERE name='stats_configurations'")
    result = cursor.fetchone()
    if result:
        print(f"\nTable schema:\n{result[0]}")
    
    conn.close()

if __name__ == "__main__":
    migrate()

