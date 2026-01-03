"""
Migration script to add mesocycle tables (mesocycles, microcycles, microcycle_days).
"""
import sqlite3
import os

DB_PATH = os.environ.get("DATABASE_PATH", "./fitness.db")

def migrate():
    print(f"Connecting to database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if mesocycles table already exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='mesocycles'")
        if cursor.fetchone():
            print("Table 'mesocycles' already exists. Skipping migration.")
            return
        
        print("Creating mesocycles table...")
        cursor.execute("""
            CREATE TABLE mesocycles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR NOT NULL,
                description VARCHAR,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL
            )
        """)
        cursor.execute("CREATE INDEX ix_mesocycles_id ON mesocycles (id)")
        
        print("Creating microcycles table...")
        cursor.execute("""
            CREATE TABLE microcycles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mesocycle_id INTEGER NOT NULL,
                name VARCHAR NOT NULL,
                position INTEGER NOT NULL,
                description VARCHAR,
                FOREIGN KEY (mesocycle_id) REFERENCES mesocycles(id) ON DELETE CASCADE
            )
        """)
        cursor.execute("CREATE INDEX ix_microcycles_id ON microcycles (id)")
        cursor.execute("CREATE INDEX ix_microcycles_mesocycle_id ON microcycles (mesocycle_id)")
        
        print("Creating microcycle_days table...")
        cursor.execute("""
            CREATE TABLE microcycle_days (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                microcycle_id INTEGER NOT NULL,
                position INTEGER NOT NULL,
                workout_id INTEGER,
                FOREIGN KEY (microcycle_id) REFERENCES microcycles(id) ON DELETE CASCADE,
                FOREIGN KEY (workout_id) REFERENCES workouts(id)
            )
        """)
        cursor.execute("CREATE INDEX ix_microcycle_days_id ON microcycle_days (id)")
        cursor.execute("CREATE INDEX ix_microcycle_days_microcycle_id ON microcycle_days (microcycle_id)")
        
        conn.commit()
        print("Migration completed successfully!")
        print("Tables created: mesocycles, microcycles, microcycle_days")
        
    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

