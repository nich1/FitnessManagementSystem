'use client';

import { useState, useEffect } from 'react';
import type { Exercise, Workout, Unit, ActivityExerciseRequest, MovementPattern, Mesocycle } from '../../types';
import { exerciseApi, workoutApi, mesocycleApi, movementPatternApi } from '../../api';

interface WorkoutFormProps {
  date: Date;
  onSubmit: (data: WorkoutFormData) => void;
  onCancel: () => void;
}

export interface WorkoutFormData {
  workout_id?: number;
  time: string;
  notes?: string;
  exercises: ActivityExerciseRequest[];
}

interface FormExercise {
  exercise_id: number;
  session_notes: string;
  sets: FormSet[];
}

interface FormSet {
  reps: number;
  weight: number;
  unit: Unit;
  rir: number | '';
  notes: string;
}

// Represents a movement pattern that needs exercise selection
interface PendingMovementPattern {
  type: 'movement_pattern';
  movement_pattern_id: number;
  movement_pattern_name: string;
  selected_exercise_id: number | null;
}

// Union type for items in the workout - can be exercise or pending movement pattern
type WorkoutFormItem = 
  | { type: 'exercise'; data: FormExercise }
  | { type: 'movement_pattern'; data: PendingMovementPattern };

// Special ID for rest day (matches MesocycleManager)
const REST_DAY_ID = 0;

export default function WorkoutForm({ date, onSubmit, onCancel }: WorkoutFormProps) {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [movementPatterns, setMovementPatterns] = useState<MovementPattern[]>([]);
  const [workoutTemplates, setWorkoutTemplates] = useState<Workout[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
  const [formItems, setFormItems] = useState<WorkoutFormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newExerciseName, setNewExerciseName] = useState('');

  // Mesocycle selection state
  const [mesocycles, setMesocycles] = useState<Mesocycle[]>([]);
  const [selectedMesocycleId, setSelectedMesocycleId] = useState<number | ''>('');
  const [selectedMicrocycleIndex, setSelectedMicrocycleIndex] = useState<number | ''>('');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | ''>('');

  useEffect(() => {
    Promise.all([
      exerciseApi.getAll(),
      workoutApi.getAll(),
      movementPatternApi.getAll()
    ])
      .then(([exercisesData, workoutsData, movementPatternsData]) => {
        setExercises(exercisesData);
        setWorkoutTemplates(workoutsData);
        setMovementPatterns(movementPatternsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Load mesocycles separately (backend might not have this endpoint yet)
    mesocycleApi.getAll()
      .then(setMesocycles)
      .catch(console.error);
  }, []);

  // Get selected mesocycle data
  const selectedMesocycle = mesocycles.find(m => m.id === selectedMesocycleId);
  const selectedMicrocycle = selectedMesocycle && selectedMicrocycleIndex !== '' 
    ? selectedMesocycle.microcycles[selectedMicrocycleIndex as number] 
    : null;
  
  // Get workout ID for the selected day in the microcycle
  const getSelectedDayWorkout = () => {
    if (!selectedMicrocycle || selectedDayIndex === '') return null;
    const dayWorkout = selectedMicrocycle.workouts[selectedDayIndex as number];
    if (!dayWorkout) return null;
    if (dayWorkout.id === REST_DAY_ID) return { isRestDay: true, workout: null };
    return { isRestDay: false, workout: dayWorkout };
  };

  // Get exercises that belong to a movement pattern
  const getExercisesForPattern = (patternId: number) => {
    return exercises.filter(ex => ex.movement_pattern_id === patternId);
  };

  // Check if all movement patterns have been resolved
  const allPatternsResolved = formItems.every(item => 
    item.type === 'exercise' || item.data.selected_exercise_id !== null
  );

  // Get the final form exercises (only resolved items)
  const getResolvedExercises = (): FormExercise[] => {
    return formItems
      .filter(item => {
        if (item.type === 'exercise') return true;
        return item.data.selected_exercise_id !== null;
      })
      .map(item => {
        if (item.type === 'exercise') return item.data;
        // Convert resolved movement pattern to exercise
        return {
          exercise_id: item.data.selected_exercise_id!,
          session_notes: '',
          sets: [{ reps: 0, weight: 0, unit: 'lb' as Unit, rir: '' as const, notes: '' }],
        };
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedExercises = getResolvedExercises();
    if (resolvedExercises.length === 0) return;
    
    const dateStr = date.toISOString().split('T')[0];
    const timestamp = `${dateStr}T${time}:00`;
    
    onSubmit({
      workout_id: selectedTemplateId || undefined,
      time: timestamp,
      notes: notes || undefined,
      exercises: resolvedExercises.map(ex => ({
        exercise_id: ex.exercise_id,
        session_notes: ex.session_notes || undefined,
        sets: ex.sets.map(s => ({
          reps: s.reps,
          weight: s.weight,
          unit: s.unit,
          rir: s.rir === '' ? undefined : s.rir,
          notes: s.notes || undefined,
        })),
      })),
    });
  };

  const loadFromTemplate = (templateId: number) => {
    const template = workoutTemplates.find(w => w.id === templateId);
    if (!template) return;

    setSelectedTemplateId(templateId);
    // Clear mesocycle selection when using template
    setSelectedMesocycleId('');
    setSelectedMicrocycleIndex('');
    setSelectedDayIndex('');
    
    // Convert template items to form items
    const newFormItems: WorkoutFormItem[] = [];
    for (const item of template.items) {
      if (item.exercise) {
        newFormItems.push({
          type: 'exercise',
          data: {
            exercise_id: item.exercise.id,
            session_notes: '',
            sets: [{ reps: 0, weight: 0, unit: 'lb', rir: '', notes: '' }],
          },
        });
      } else if (item.movement_pattern) {
        // Add as pending movement pattern - user must choose exercise
        newFormItems.push({
          type: 'movement_pattern',
          data: {
            type: 'movement_pattern',
            movement_pattern_id: item.movement_pattern.id,
            movement_pattern_name: item.movement_pattern.name,
            selected_exercise_id: null,
          },
        });
      }
    }
    setFormItems(newFormItems);
  };

  const loadFromMesocycleDay = () => {
    const dayData = getSelectedDayWorkout();
    if (!dayData || dayData.isRestDay || !dayData.workout) return;
    
    const template = dayData.workout;
    // Clear template selection when using mesocycle
    setSelectedTemplateId('');
    
    // Convert template items to form items
    const newFormItems: WorkoutFormItem[] = [];
    for (const item of template.items) {
      if (item.exercise) {
        newFormItems.push({
          type: 'exercise',
          data: {
            exercise_id: item.exercise.id,
            session_notes: '',
            sets: [{ reps: 0, weight: 0, unit: 'lb', rir: '', notes: '' }],
          },
        });
      } else if (item.movement_pattern) {
        // Add as pending movement pattern - user must choose exercise
        newFormItems.push({
          type: 'movement_pattern',
          data: {
            type: 'movement_pattern',
            movement_pattern_id: item.movement_pattern.id,
            movement_pattern_name: item.movement_pattern.name,
            selected_exercise_id: null,
          },
        });
      }
    }
    setFormItems(newFormItems);
  };

  const addExercise = (exerciseId: number) => {
    setFormItems([
      ...formItems,
      {
        type: 'exercise',
        data: {
          exercise_id: exerciseId,
          session_notes: '',
          sets: [{ reps: 0, weight: 0, unit: 'lb', rir: '', notes: '' }],
        },
      },
    ]);
  };

  const selectExerciseForPattern = (itemIndex: number, exerciseId: number) => {
    const newItems = [...formItems];
    const item = newItems[itemIndex];
    if (item.type === 'movement_pattern') {
      // Convert to exercise
      newItems[itemIndex] = {
        type: 'exercise',
        data: {
          exercise_id: exerciseId,
          session_notes: '',
          sets: [{ reps: 0, weight: 0, unit: 'lb', rir: '', notes: '' }],
        },
      };
      setFormItems(newItems);
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...formItems];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    setFormItems(newItems);
  };

  const removeItem = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof FormExercise, value: string | number) => {
    const newItems = [...formItems];
    const item = newItems[index];
    if (item.type === 'exercise') {
      newItems[index] = {
        ...item,
        data: { ...item.data, [field]: value },
      };
      setFormItems(newItems);
    }
  };

  const addSet = (itemIndex: number) => {
    const newItems = [...formItems];
    const item = newItems[itemIndex];
    if (item.type === 'exercise') {
      const lastSet = item.data.sets[item.data.sets.length - 1];
      const newSet = {
        reps: lastSet?.reps || 0,
        weight: lastSet?.weight || 0,
        unit: lastSet?.unit || 'lb' as Unit,
        rir: lastSet?.rir ?? '' as number | '',
        notes: '',
      };
      newItems[itemIndex] = {
        ...item,
        data: { ...item.data, sets: [...item.data.sets, newSet] },
      };
      setFormItems(newItems);
    }
  };

  const removeSet = (itemIndex: number, setIndex: number) => {
    const newItems = [...formItems];
    const item = newItems[itemIndex];
    if (item.type === 'exercise') {
      newItems[itemIndex] = {
        ...item,
        data: { ...item.data, sets: item.data.sets.filter((_, i) => i !== setIndex) },
      };
      setFormItems(newItems);
    }
  };

  const updateSet = (itemIndex: number, setIndex: number, field: keyof FormSet, value: number | string) => {
    const newItems = [...formItems];
    const item = newItems[itemIndex];
    if (item.type === 'exercise') {
      const newSets = [...item.data.sets];
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      newItems[itemIndex] = {
        ...item,
        data: { ...item.data, sets: newSets },
      };
      setFormItems(newItems);
    }
  };

  const duplicateSet = (itemIndex: number, setIndex: number) => {
    const newItems = [...formItems];
    const item = newItems[itemIndex];
    if (item.type === 'exercise') {
      const setToDuplicate = item.data.sets[setIndex];
      const newSets = [...item.data.sets];
      newSets.splice(setIndex + 1, 0, { ...setToDuplicate });
      newItems[itemIndex] = {
        ...item,
        data: { ...item.data, sets: newSets },
      };
      setFormItems(newItems);
    }
  };

  const createExercise = async () => {
    if (!newExerciseName.trim()) return;
    try {
      const newExercise = await exerciseApi.create({ name: newExerciseName.trim() });
      setExercises([...exercises, newExercise]);
      setNewExerciseName('');
    } catch (error) {
      console.error('Failed to create exercise:', error);
    }
  };

  const getExerciseName = (id: number) => exercises.find(e => e.id === id)?.name || 'Unknown';
  const getExerciseNotes = (id: number) => exercises.find(e => e.id === id)?.notes;

  // Count unresolved movement patterns
  const unresolvedCount = formItems.filter(
    item => item.type === 'movement_pattern' && item.data.selected_exercise_id === null
  ).length;

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Workout Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">From Template</label>
          <select
            value={selectedTemplateId}
            onChange={(e) => loadFromTemplate(parseInt(e.target.value))}
            className="form-select"
          >
            <option value="">Select a template...</option>
            {workoutTemplates.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* From Mesocycle Section */}
      <div className="form-group">
        <label className="form-label">From Mesocycle</label>
        <div className="mesocycle-selector">
          <select
            value={selectedMesocycleId}
            onChange={(e) => {
              setSelectedMesocycleId(e.target.value ? parseInt(e.target.value) : '');
              setSelectedMicrocycleIndex('');
              setSelectedDayIndex('');
            }}
            className="form-select"
          >
            <option value="">Select mesocycle...</option>
            {mesocycles.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <select
            value={selectedMicrocycleIndex}
            onChange={(e) => {
              setSelectedMicrocycleIndex(e.target.value ? parseInt(e.target.value) : '');
              setSelectedDayIndex('');
            }}
            className="form-select"
            disabled={!selectedMesocycle}
          >
            <option value="">Select microcycle...</option>
            {selectedMesocycle?.microcycles.map((mc, idx) => (
              <option key={idx} value={idx}>{mc.name}</option>
            ))}
          </select>

          <select
            value={selectedDayIndex}
            onChange={(e) => {
              setSelectedDayIndex(e.target.value ? parseInt(e.target.value) : '');
            }}
            className="form-select"
            disabled={!selectedMicrocycle}
          >
            <option value="">Select day...</option>
            {selectedMicrocycle?.workouts.map((w, idx) => (
              <option key={idx} value={idx}>
                Day {idx + 1}: {w.id === REST_DAY_ID ? '🛌 Rest Day' : `🏋️ ${w.name}`}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadFromMesocycleDay}
            disabled={
              selectedDayIndex === '' || 
              getSelectedDayWorkout()?.isRestDay
            }
          >
            Load
          </button>
        </div>
        {selectedDayIndex !== '' && getSelectedDayWorkout()?.isRestDay && (
          <div className="form-hint-message">🛌 This is a rest day - no workout to load</div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Workout Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="form-textarea"
          placeholder="General workout notes..."
          rows={2}
        />
      </div>

      <div className="form-group">
        <div className="form-label-row">
          <label className="form-label">Create New Exercise</label>
        </div>
        <div className="create-exercise-row">
          <input
            type="text"
            value={newExerciseName}
            onChange={(e) => setNewExerciseName(e.target.value)}
            className="form-input"
            placeholder="Exercise name"
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={createExercise}
            disabled={!newExerciseName.trim()}
          >
            Create
          </button>
        </div>
      </div>

      <div className="form-group">
        <div className="form-label-row">
          <label className="form-label">Add Exercise</label>
          <select
            className="form-select"
            onChange={(e) => {
              if (e.target.value) {
                addExercise(parseInt(e.target.value));
                e.target.value = '';
              }
            }}
            disabled={exercises.length === 0}
          >
            <option value="">Select exercise to add...</option>
            {exercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="form-loading">Loading...</div>
      ) : formItems.length === 0 ? (
        <div className="form-empty">
          No exercises added yet. Select a template or add exercises above.
        </div>
      ) : (
        <>
          {unresolvedCount > 0 && (
            <div className="movement-pattern-warning">
              ⚠️ {unresolvedCount} movement pattern{unresolvedCount > 1 ? 's' : ''} need{unresolvedCount === 1 ? 's' : ''} exercise selection
            </div>
          )}
          <div className="activity-exercises-list">
            {formItems.map((item, itemIndex) => {
              if (item.type === 'movement_pattern') {
                // Render movement pattern selector
                const patternExercises = getExercisesForPattern(item.data.movement_pattern_id);
                return (
                  <div key={itemIndex} className="activity-exercise-card movement-pattern-card">
                    <div className="activity-exercise-header">
                      <div className="exercise-info">
                        <span className="movement-pattern-badge">🌀 Movement Pattern</span>
                        <span className="movement-pattern-name">{item.data.movement_pattern_name}</span>
                      </div>
                      <div className="exercise-actions">
                        <button
                          type="button"
                          className="btn-icon-small"
                          onClick={() => moveItem(itemIndex, 'up')}
                          disabled={itemIndex === 0}
                          title="Move up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          className="btn-icon-small"
                          onClick={() => moveItem(itemIndex, 'down')}
                          disabled={itemIndex === formItems.length - 1}
                          title="Move down"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          className="btn-remove-small"
                          onClick={() => removeItem(itemIndex)}
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div className="movement-pattern-selector">
                      <label className="form-label">Choose exercise:</label>
                      {patternExercises.length > 0 ? (
                        <select
                          className="form-select"
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              selectExerciseForPattern(itemIndex, parseInt(e.target.value));
                            }
                          }}
                        >
                          <option value="">Select an exercise...</option>
                          {patternExercises.map(ex => (
                            <option key={ex.id} value={ex.id}>{ex.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="form-hint-warning">
                          No exercises found for this movement pattern. 
                          Create one in the Exercises manager.
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Render regular exercise
              const formEx = item.data;
              const exerciseNotes = getExerciseNotes(formEx.exercise_id);
              return (
                <div key={itemIndex} className="activity-exercise-card">
                  <div className="activity-exercise-header">
                    <div className="exercise-info">
                      <span className="exercise-name">{getExerciseName(formEx.exercise_id)}</span>
                      {exerciseNotes && (
                        <span className="exercise-default-notes" title={exerciseNotes}>
                          ℹ️ {exerciseNotes}
                        </span>
                      )}
                    </div>
                    <div className="exercise-actions">
                      <button
                        type="button"
                        className="btn-icon-small"
                        onClick={() => moveItem(itemIndex, 'up')}
                        disabled={itemIndex === 0}
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="btn-icon-small"
                        onClick={() => moveItem(itemIndex, 'down')}
                        disabled={itemIndex === formItems.length - 1}
                        title="Move down"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        className="btn-remove-small"
                        onClick={() => removeItem(itemIndex)}
                        title="Remove exercise"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  <div className="session-notes-row">
                    <input
                      type="text"
                      value={formEx.session_notes}
                      onChange={(e) => updateExercise(itemIndex, 'session_notes', e.target.value)}
                      className="form-input"
                      placeholder="Session notes for this exercise..."
                    />
                  </div>

                  <div className="sets-list">
                    {formEx.sets.map((set, setIndex) => (
                      <div key={setIndex} className="set-form-item">
                        <span className="set-number">{setIndex + 1}</span>
                        <input
                          type="number"
                          min="1"
                          value={set.reps === 0 ? '' : set.reps}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateSet(itemIndex, setIndex, 'reps', val === '' ? 0 : parseInt(val, 10) || 0);
                          }}
                          onFocus={(e) => e.target.select()}
                          className="form-input reps-input"
                          placeholder="Reps"
                        />
                        <span className="form-hint" aria-label="repetitions">×</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={set.weight === 0 ? '' : set.weight}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateSet(itemIndex, setIndex, 'weight', val === '' ? 0 : parseFloat(val) || 0);
                          }}
                          onFocus={(e) => e.target.select()}
                          className="form-input weight-input"
                          placeholder="Weight"
                        />
                        <select
                          value={set.unit}
                          onChange={(e) => updateSet(itemIndex, setIndex, 'unit', e.target.value)}
                          className="form-select unit-select"
                        >
                          <option value="lb">lb</option>
                          <option value="kg">kg</option>
                        </select>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={set.rir}
                          onChange={(e) => updateSet(itemIndex, setIndex, 'rir', e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="form-input rir-input"
                          placeholder="RIR"
                        />
                        <span className="form-hint">RIR</span>
                        <div className="set-actions">
                          <button
                            type="button"
                            className="btn-icon-small"
                            onClick={() => duplicateSet(itemIndex, setIndex)}
                            title="Duplicate set"
                          >
                            ⧉
                          </button>
                          <button
                            type="button"
                            className="btn-remove-small"
                            onClick={() => removeSet(itemIndex, setIndex)}
                            disabled={formEx.sets.length === 1}
                            title="Remove set"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn-add-small"
                    onClick={() => addSet(itemIndex)}
                  >
                    + Add Set
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={formItems.length === 0 || !allPatternsResolved}
          title={!allPatternsResolved ? 'Please select exercises for all movement patterns' : ''}
        >
          Save Workout
        </button>
      </div>
    </form>
  );
}
