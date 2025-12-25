"""
Migration script to update hydration from single entry to multiple entries.
This drops the old hydration_id column and adds hydration_ids (JSON).
"""
import sqlite3
import os

DB_PATH = os.environ.get("DATABASE_PATH", "/app/fitness.db")

def migrate():
    print(f"Connecting to database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if hydration_id column exists
        cursor.execute("PRAGMA table_info(log_entries)")
        columns = {row[1]: row for row in cursor.fetchall()}
        
        if 'hydration_id' in columns and 'hydration_ids' not in columns:
            print("Migrating: hydration_id -> hydration_ids")
            
            # SQLite doesn't support DROP COLUMN directly in older versions,
            # so we need to recreate the table
            
            # 1. Create new table with updated schema
            cursor.execute("""
                CREATE TABLE log_entries_new (
                    id INTEGER PRIMARY KEY,
                    timestamp DATETIME NOT NULL,
                    phase_id INTEGER REFERENCES phases(id),
                    morning_weight FLOAT,
                    sleep_id INTEGER REFERENCES sleep(id),
                    hydration_ids JSON,
                    workout_ids JSON,
                    cardio_ids JSON,
                    supplement_ids JSON,
                    stress_id INTEGER REFERENCES stress(id),
                    num_standard_drinks INTEGER,
                    notes TEXT
                )
            """)
            
            # 2. Copy data from old table (excluding hydration_id, setting hydration_ids to null)
            cursor.execute("""
                INSERT INTO log_entries_new (id, timestamp, phase_id, morning_weight, sleep_id, hydration_ids, workout_ids, cardio_ids, supplement_ids, stress_id, num_standard_drinks, notes)
                SELECT id, timestamp, phase_id, morning_weight, sleep_id, NULL, workout_ids, cardio_ids, supplement_ids, stress_id, num_standard_drinks, notes
                FROM log_entries
            """)
            
            # 3. Drop old table
            cursor.execute("DROP TABLE log_entries")
            
            # 4. Rename new table
            cursor.execute("ALTER TABLE log_entries_new RENAME TO log_entries")
            
            # 5. Recreate index
            cursor.execute("CREATE INDEX IF NOT EXISTS ix_log_entries_id ON log_entries (id)")
            
            conn.commit()
            print("Migration completed successfully!")
            
        elif 'hydration_ids' in columns:
            print("Already migrated: hydration_ids column exists")
        else:
            print("Unexpected schema state. Columns found:", list(columns.keys()))
            
    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

