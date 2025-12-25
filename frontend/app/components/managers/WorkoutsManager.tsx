'use client';

import { useState, useEffect } from 'react';
import type { Workout, Exercise, MovementPattern, WorkoutItemRequest } from '../../types';
import { workoutApi, exerciseApi, movementPatternApi } from '../../api';
import { useConfirmDialog } from '../ConfirmDialog';

interface FormItem {
  type: 'exercise' | 'pattern';
  id: number;
  name: string;
}

export default function WorkoutsManager() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [movementPatterns, setMovementPatterns] = useState<MovementPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [formItems, setFormItems] = useState<FormItem[]>([]);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<number>>(new Set());
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [workoutsData, exercisesData, patternsData] = await Promise.all([
        workoutApi.getAll(),
        exerciseApi.getAll(),
        movementPatternApi.getAll()
      ]);
      setWorkouts(workoutsData);
      setExercises(exercisesData);
      setMovementPatterns(patternsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingWorkout(null);
    setNewName('');
    setNewDescription('');
    setFormItems([]);
    setShowForm(true);
  };

  const handleEdit = (workout: Workout) => {
    setEditingWorkout(workout);
    setNewName(workout.name);
    setNewDescription(workout.description || '');
    
    // Convert workout items to form items
    const items: FormItem[] = workout.items.map(item => {
      if (item.exercise) {
        return { type: 'exercise' as const, id: item.exercise.id, name: item.exercise.name };
      } else if (item.movement_pattern) {
        return { type: 'pattern' as const, id: item.movement_pattern.id, name: item.movement_pattern.name };
      }
      return null;
    }).filter((item): item is FormItem => item !== null);
    
    setFormItems(items);
    setShowForm(true);
  };

  const handleDelete = async (workout: Workout) => {
    const confirmed = await confirm({
      title: 'Delete Workout',
      message: `Are you sure you want to delete "${workout.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      await workoutApi.delete(workout.id);
      setWorkouts(workouts.filter(w => w.id !== workout.id));
    } catch (error) {
      console.error('Failed to delete workout:', error);
    }
  };

  const addExercise = (exercise: Exercise) => {
    setFormItems([...formItems, { type: 'exercise', id: exercise.id, name: exercise.name }]);
  };

  const addPattern = (pattern: MovementPattern) => {
    setFormItems([...formItems, { type: 'pattern', id: pattern.id, name: pattern.name }]);
  };

  const removeItem = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...formItems];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newItems.length) return;
    
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    setFormItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || formItems.length === 0) return;

    setSaving(true);
    try {
      const items: WorkoutItemRequest[] = formItems.map(item => ({
        exercise_id: item.type === 'exercise' ? item.id : undefined,
        movement_pattern_id: item.type === 'pattern' ? item.id : undefined
      }));

      const data = {
        name: newName,
        description: newDescription || undefined,
        items
      };
      
      if (editingWorkout) {
        const updated = await workoutApi.update(editingWorkout.id, data);
        setWorkouts(workouts.map(w => w.id === editingWorkout.id ? updated : w));
      } else {
        const created = await workoutApi.create(data);
        setWorkouts([...workouts, created]);
      }
      setShowForm(false);
      setNewName('');
      setNewDescription('');
      setFormItems([]);
      setEditingWorkout(null);
    } catch (error) {
      console.error('Failed to save workout:', error);
      alert('Failed to save workout');
    } finally {
      setSaving(false);
    }
  };

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedWorkouts);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedWorkouts(newExpanded);
  };

  const filteredWorkouts = workouts.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="manager-loading">Loading workouts...</div>;
  }

  return (
    <div className="manager">
      <div className="manager-header">
        <h2 className="manager-title">Workout Templates</h2>
        <div className="manager-actions">
          <input
            type="text"
            placeholder="Search workouts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="manager-search"
          />
          <button className="btn btn-primary" onClick={handleCreate}>
            + New Workout
          </button>
        </div>
      </div>

      {showForm && (
        <div className="manager-form-overlay">
          <div className="manager-form-container large">
            <div className="manager-form-header">
              <h3>{editingWorkout ? 'Edit Workout' : 'New Workout'}</h3>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="manager-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Workout Name *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="form-input"
                    placeholder="e.g., Push Day, Pull Day, Full Body"
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="form-input"
                    placeholder="Optional description..."
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Exercises & Movement Patterns *</label>
                <div className="workout-builder">
                  <div className="builder-sidebar">
                    <div className="builder-section">
                      <h4>Exercises</h4>
                      <div className="builder-items">
                        {exercises.map(ex => (
                          <button
                            key={ex.id}
                            type="button"
                            className="builder-item"
                            onClick={() => addExercise(ex)}
                          >
                            + {ex.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="builder-section">
                      <h4>Movement Patterns</h4>
                      <div className="builder-items">
                        {movementPatterns.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            className="builder-item pattern"
                            onClick={() => addPattern(p)}
                          >
                            + {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="builder-main">
                    <h4>Workout Order</h4>
                    {formItems.length === 0 ? (
                      <div className="builder-empty">
                        Click exercises or patterns to add them to your workout
                      </div>
                    ) : (
                      <div className="builder-list">
                        {formItems.map((item, index) => (
                          <div key={`${item.type}-${item.id}-${index}`} className={`builder-list-item ${item.type}`}>
                            <span className="item-position">{index + 1}</span>
                            <span className={`item-type-badge ${item.type}`}>
                              {item.type === 'exercise' ? 'E' : 'P'}
                            </span>
                            <span className="item-name">{item.name}</span>
                            <div className="item-controls">
                              <button
                                type="button"
                                className="btn-icon small"
                                onClick={() => moveItem(index, 'up')}
                                disabled={index === 0}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                className="btn-icon small"
                                onClick={() => moveItem(index, 'down')}
                                disabled={index === formItems.length - 1}
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                className="btn-icon small danger"
                                onClick={() => removeItem(index)}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving || formItems.length === 0}>
                  {saving ? 'Saving...' : editingWorkout ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="manager-list">
        {filteredWorkouts.length === 0 ? (
          <div className="manager-empty">
            {searchQuery ? 'No workouts match your search.' : 'No workout templates yet. Create your first workout!'}
          </div>
        ) : (
          <div className="simple-list">
            {filteredWorkouts.map((workout) => {
              const isExpanded = expandedWorkouts.has(workout.id);
              
              return (
                <div key={workout.id} className="simple-list-item expandable">
                  <div className="item-main" onClick={() => toggleExpanded(workout.id)}>
                    <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                    <div className="item-content">
                      <span className="item-name">{workout.name}</span>
                      {workout.description && (
                        <span className="item-description">{workout.description}</span>
                      )}
                      <span className="item-count">{workout.items.length} item{workout.items.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="item-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="btn-icon" onClick={() => handleEdit(workout)} title="Edit">
                        ✏️
                      </button>
                      <button className="btn-icon danger" onClick={() => handleDelete(workout)} title="Delete">
                        🗑️
                      </button>
                    </div>
                  </div>
                  {isExpanded && workout.items.length > 0 && (
                    <div className="item-children">
                      {workout.items.map((item, index) => (
                        <div key={item.id} className="child-item">
                          <span className="child-position">{index + 1}.</span>
                          <span className={`child-type ${item.exercise ? 'exercise' : 'pattern'}`}>
                            {item.exercise ? 'E' : 'P'}
                          </span>
                          <span>{item.exercise?.name || item.movement_pattern?.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {ConfirmDialogComponent}
    </div>
  );
}

