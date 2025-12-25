"""
Migration script to update the workout schema to the new structure.

This script:
1. Creates the movement_patterns table
2. Adds movement_pattern_id and notes columns to exercises table
3. Creates the workout_items table (replacing workout_sets for templates)
4. Updates the workouts table structure
5. Creates the activities, activity_exercises, and activity_sets tables
6. Creates the log_entry_activities table
7. Removes workout_ids from log_entries

Run this script with: docker exec fitness-backend python migrations/migrate_workout_schema.py
"""

import sqlite3
import os

DB_PATH = "/app/fitness.db"

def run_migration():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Starting migration...")
    
    # 1. Create movement_patterns table
    print("Creating movement_patterns table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS movement_patterns (
            id INTEGER PRIMARY KEY,
            name VARCHAR NOT NULL UNIQUE,
            description TEXT
        )
    """)
    
    # 2. Add columns to exercises table
    print("Updating exercises table...")
    try:
        cursor.execute("ALTER TABLE exercises ADD COLUMN movement_pattern_id INTEGER REFERENCES movement_patterns(id)")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print("  - movement_pattern_id column already exists")
        else:
            raise
    
    try:
        cursor.execute("ALTER TABLE exercises ADD COLUMN notes TEXT")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print("  - notes column already exists")
        else:
            raise
    
    # 3. Create workout_items table
    print("Creating workout_items table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS workout_items (
            id INTEGER PRIMARY KEY,
            workout_id INTEGER NOT NULL REFERENCES workouts(id),
            position INTEGER NOT NULL,
            exercise_id INTEGER REFERENCES exercises(id),
            movement_pattern_id INTEGER REFERENCES movement_patterns(id)
        )
    """)
    
    # 4. Update workouts table - add name and description columns
    print("Updating workouts table...")
    try:
        cursor.execute("ALTER TABLE workouts ADD COLUMN name VARCHAR NOT NULL DEFAULT 'Workout'")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print("  - name column already exists")
        else:
            raise
    
    try:
        cursor.execute("ALTER TABLE workouts ADD COLUMN description VARCHAR")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print("  - description column already exists")
        else:
            raise
    
    # 5. Create activities table
    print("Creating activities table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY,
            workout_id INTEGER REFERENCES workouts(id),
            time DATETIME NOT NULL,
            notes TEXT
        )
    """)
    
    # 6. Create activity_exercises table
    print("Creating activity_exercises table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS activity_exercises (
            id INTEGER PRIMARY KEY,
            activity_id INTEGER NOT NULL REFERENCES activities(id),
            exercise_id INTEGER NOT NULL REFERENCES exercises(id),
            position INTEGER NOT NULL,
            session_notes TEXT
        )
    """)
    
    # 7. Create activity_sets table
    print("Creating activity_sets table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS activity_sets (
            id INTEGER PRIMARY KEY,
            activity_exercise_id INTEGER NOT NULL REFERENCES activity_exercises(id),
            reps INTEGER NOT NULL,
            weight REAL NOT NULL,
            unit VARCHAR,
            rir INTEGER,
            notes VARCHAR
        )
    """)
    
    # 8. Create log_entry_activities table
    print("Creating log_entry_activities table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS log_entry_activities (
            id INTEGER PRIMARY KEY,
            log_entry_id INTEGER NOT NULL REFERENCES log_entries(id),
            activity_id INTEGER NOT NULL REFERENCES activities(id)
        )
    """)
    
    # 9. Migrate existing workout data to activities
    print("Migrating existing workout data...")
    
    # Check if there are any existing workouts with sets
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='workout_sets'")
    if cursor.fetchone():
        # Get existing workouts
        cursor.execute("SELECT id, time, notes FROM workouts")
        workouts = cursor.fetchall()
        
        for workout_id, workout_time, workout_notes in workouts:
            # Create an activity for each workout
            cursor.execute("""
                INSERT INTO activities (workout_id, time, notes)
                VALUES (?, ?, ?)
            """, (None, workout_time, workout_notes))
            activity_id = cursor.lastrowid
            
            # Get sets for this workout
            cursor.execute("""
                SELECT exercise_id, reps, weight, unit, notes
                FROM workout_sets
                WHERE workout_id = ?
                ORDER BY id
            """, (workout_id,))
            sets = cursor.fetchall()
            
            # Group sets by exercise
            exercise_sets = {}
            for exercise_id, reps, weight, unit, notes in sets:
                if exercise_id not in exercise_sets:
                    exercise_sets[exercise_id] = []
                exercise_sets[exercise_id].append((reps, weight, unit, notes))
            
            # Create activity_exercises and activity_sets
            position = 0
            for exercise_id, sets_data in exercise_sets.items():
                cursor.execute("""
                    INSERT INTO activity_exercises (activity_id, exercise_id, position, session_notes)
                    VALUES (?, ?, ?, NULL)
                """, (activity_id, exercise_id, position))
                activity_exercise_id = cursor.lastrowid
                
                for reps, weight, unit, notes in sets_data:
                    cursor.execute("""
                        INSERT INTO activity_sets (activity_exercise_id, reps, weight, unit, rir, notes)
                        VALUES (?, ?, ?, ?, NULL, ?)
                    """, (activity_exercise_id, reps, weight, unit, notes))
                
                position += 1
            
            # Link activity to log entries that had this workout
            cursor.execute("""
                SELECT id, workout_ids FROM log_entries WHERE workout_ids IS NOT NULL
            """)
            for log_entry_id, workout_ids_json in cursor.fetchall():
                import json
                try:
                    workout_ids = json.loads(workout_ids_json) if workout_ids_json else []
                    if workout_id in workout_ids:
                        cursor.execute("""
                            INSERT INTO log_entry_activities (log_entry_id, activity_id)
                            VALUES (?, ?)
                        """, (log_entry_id, activity_id))
                except:
                    pass
        
        print(f"  - Migrated {len(workouts)} workouts to activities")
    
    conn.commit()
    print("Migration completed successfully!")
    conn.close()

if __name__ == "__main__":
    run_migration()

