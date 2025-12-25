"""
Migration script to update supplements from JSON array to junction table with servings.
This creates the log_entry_supplements table and migrates existing data.
"""
import sqlite3
import json
import os

DB_PATH = os.environ.get("DATABASE_PATH", "/app/fitness.db")

def migrate():
    print(f"Connecting to database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if log_entry_supplements table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='log_entry_supplements'")
        table_exists = cursor.fetchone() is not None
        
        if not table_exists:
            print("Creating log_entry_supplements table...")
            
            # 1. Create the junction table
            cursor.execute("""
                CREATE TABLE log_entry_supplements (
                    id INTEGER PRIMARY KEY,
                    log_entry_id INTEGER NOT NULL REFERENCES log_entries(id),
                    supplement_id INTEGER NOT NULL REFERENCES supplements(id),
                    servings FLOAT NOT NULL DEFAULT 1.0
                )
            """)
            cursor.execute("CREATE INDEX ix_log_entry_supplements_log_entry_id ON log_entry_supplements (log_entry_id)")
            cursor.execute("CREATE INDEX ix_log_entry_supplements_supplement_id ON log_entry_supplements (supplement_id)")
            
            # 2. Migrate existing data from supplement_ids JSON column
            cursor.execute("SELECT id, supplement_ids FROM log_entries WHERE supplement_ids IS NOT NULL")
            rows = cursor.fetchall()
            
            for log_entry_id, supplement_ids_json in rows:
                if supplement_ids_json:
                    try:
                        supplement_ids = json.loads(supplement_ids_json)
                        for supp_id in supplement_ids:
                            cursor.execute("""
                                INSERT INTO log_entry_supplements (log_entry_id, supplement_id, servings)
                                VALUES (?, ?, 1.0)
                            """, (log_entry_id, supp_id))
                    except json.JSONDecodeError:
                        print(f"Warning: Could not parse supplement_ids for log_entry {log_entry_id}")
            
            print(f"Migrated {len(rows)} log entries with supplements")
            
            # 3. Remove supplement_ids column from log_entries
            # SQLite doesn't support DROP COLUMN in older versions, so we recreate the table
            cursor.execute("PRAGMA table_info(log_entries)")
            columns = [row[1] for row in cursor.fetchall()]
            
            if 'supplement_ids' in columns:
                print("Removing supplement_ids column from log_entries...")
                
                # Create new table without supplement_ids
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
                        stress_id INTEGER REFERENCES stress(id),
                        num_standard_drinks INTEGER,
                        notes TEXT
                    )
                """)
                
                # Copy data (excluding supplement_ids)
                cursor.execute("""
                    INSERT INTO log_entries_new (id, timestamp, phase_id, morning_weight, sleep_id, hydration_ids, workout_ids, cardio_ids, stress_id, num_standard_drinks, notes)
                    SELECT id, timestamp, phase_id, morning_weight, sleep_id, hydration_ids, workout_ids, cardio_ids, stress_id, num_standard_drinks, notes
                    FROM log_entries
                """)
                
                # Drop old table and rename new one
                cursor.execute("DROP TABLE log_entries")
                cursor.execute("ALTER TABLE log_entries_new RENAME TO log_entries")
                cursor.execute("CREATE INDEX IF NOT EXISTS ix_log_entries_id ON log_entries (id)")
            
            conn.commit()
            print("Migration completed successfully!")
            
        else:
            print("Already migrated: log_entry_supplements table exists")
            
    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

