'use client';

import { useState, useEffect } from 'react';
import type { MovementPattern, Exercise } from '../../types';
import { movementPatternApi, exerciseApi } from '../../api';
import { useConfirmDialog } from '../ConfirmDialog';

export default function MovementPatternsManager() {
  const [movementPatterns, setMovementPatterns] = useState<MovementPattern[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editingPattern, setEditingPattern] = useState<MovementPattern | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPatterns, setExpandedPatterns] = useState<Set<number>>(new Set());
  const [addingExerciseToPattern, setAddingExerciseToPattern] = useState<number | null>(null);
  const [formSelectedExercises, setFormSelectedExercises] = useState<number[]>([]);
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [patternsData, exercisesData] = await Promise.all([
        movementPatternApi.getAll(),
        exerciseApi.getAll()
      ]);
      setMovementPatterns(patternsData);
      setExercises(exercisesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPattern(null);
    setNewName('');
    setNewDescription('');
    setFormSelectedExercises([]);
    setShowForm(true);
  };

  const handleEdit = (pattern: MovementPattern) => {
    setEditingPattern(pattern);
    setNewName(pattern.name);
    setNewDescription(pattern.description || '');
    // Get exercises currently assigned to this pattern
    const patternExerciseIds = exercises
      .filter(ex => ex.movement_pattern_id === pattern.id)
      .map(ex => ex.id);
    setFormSelectedExercises(patternExerciseIds);
    setShowForm(true);
  };

  const handleDelete = async (pattern: MovementPattern) => {
    const confirmed = await confirm({
      title: 'Delete Movement Pattern',
      message: `Are you sure you want to delete "${pattern.name}"? Exercises using this pattern will no longer be associated with it.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      await movementPatternApi.delete(pattern.id);
      setMovementPatterns(movementPatterns.filter(p => p.id !== pattern.id));
    } catch (error) {
      console.error('Failed to delete movement pattern:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setSaving(true);
    try {
      const data = {
        name: newName,
        description: newDescription || undefined
      };
      
      let patternId: number;
      
      if (editingPattern) {
        const updated = await movementPatternApi.update(editingPattern.id, data);
        setMovementPatterns(movementPatterns.map(p => p.id === editingPattern.id ? { ...updated, exercise_ids: formSelectedExercises } : p));
        patternId = editingPattern.id;
        
        // Find exercises that were removed from the pattern
        const previousExerciseIds = exercises
          .filter(ex => ex.movement_pattern_id === editingPattern.id)
          .map(ex => ex.id);
        const removedExerciseIds = previousExerciseIds.filter(id => !formSelectedExercises.includes(id));
        
        // Remove pattern from exercises that were deselected
        for (const exId of removedExerciseIds) {
          const exercise = exercises.find(ex => ex.id === exId);
          if (exercise) {
            await exerciseApi.update(exId, {
              name: exercise.name,
              movement_pattern_id: undefined,
              notes: exercise.notes
            });
          }
        }
      } else {
        const created = await movementPatternApi.create(data);
        setMovementPatterns([...movementPatterns, { ...created, exercise_ids: formSelectedExercises }]);
        patternId = created.id;
      }
      
      // Update exercises to assign them to this pattern
      const updatedExercises = [...exercises];
      for (const exId of formSelectedExercises) {
        const exercise = exercises.find(ex => ex.id === exId);
        if (exercise && exercise.movement_pattern_id !== patternId) {
          await exerciseApi.update(exId, {
            name: exercise.name,
            movement_pattern_id: patternId,
            notes: exercise.notes
          });
          const idx = updatedExercises.findIndex(ex => ex.id === exId);
          if (idx !== -1) {
            updatedExercises[idx] = { ...updatedExercises[idx], movement_pattern_id: patternId };
          }
        }
      }
      
      // Also update removed exercises in state
      if (editingPattern) {
        const previousExerciseIds = exercises
          .filter(ex => ex.movement_pattern_id === editingPattern.id)
          .map(ex => ex.id);
        const removedExerciseIds = previousExerciseIds.filter(id => !formSelectedExercises.includes(id));
        for (const exId of removedExerciseIds) {
          const idx = updatedExercises.findIndex(ex => ex.id === exId);
          if (idx !== -1) {
            updatedExercises[idx] = { ...updatedExercises[idx], movement_pattern_id: undefined };
          }
        }
      }
      
      setExercises(updatedExercises);
      setShowForm(false);
      setNewName('');
      setNewDescription('');
      setFormSelectedExercises([]);
      setEditingPattern(null);
    } catch (error) {
      console.error('Failed to save movement pattern:', error);
      alert('Failed to save movement pattern');
    } finally {
      setSaving(false);
    }
  };

  const addExerciseToForm = (exerciseId: number) => {
    if (!formSelectedExercises.includes(exerciseId)) {
      setFormSelectedExercises([...formSelectedExercises, exerciseId]);
    }
  };

  const removeExerciseFromForm = (exerciseId: number) => {
    setFormSelectedExercises(formSelectedExercises.filter(id => id !== exerciseId));
  };

  const getAvailableExercisesForForm = () => {
    // Show exercises not already selected in the form
    // Also exclude exercises assigned to OTHER patterns (but include ones from current editing pattern)
    return exercises.filter(ex => {
      if (formSelectedExercises.includes(ex.id)) return false;
      if (ex.movement_pattern_id && editingPattern && ex.movement_pattern_id !== editingPattern.id) return false;
      if (ex.movement_pattern_id && !editingPattern) return false;
      return true;
    });
  };

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedPatterns);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedPatterns(newExpanded);
  };

  const getExercisesForPattern = (patternId: number) => {
    return exercises.filter(ex => ex.movement_pattern_id === patternId);
  };

  const getUnassignedExercises = (patternId: number) => {
    return exercises.filter(ex => ex.movement_pattern_id !== patternId);
  };

  const addExerciseToPattern = async (exerciseId: number, patternId: number) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    try {
      await exerciseApi.update(exerciseId, {
        name: exercise.name,
        movement_pattern_id: patternId,
        notes: exercise.notes
      });
      // Update local state
      setExercises(exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, movement_pattern_id: patternId } : ex
      ));
      setAddingExerciseToPattern(null);
    } catch (error) {
      console.error('Failed to add exercise to pattern:', error);
    }
  };

  const removeExerciseFromPattern = async (exerciseId: number) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    try {
      await exerciseApi.update(exerciseId, {
        name: exercise.name,
        movement_pattern_id: undefined,
        notes: exercise.notes
      });
      // Update local state
      setExercises(exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, movement_pattern_id: undefined } : ex
      ));
    } catch (error) {
      console.error('Failed to remove exercise from pattern:', error);
    }
  };

  const filteredPatterns = movementPatterns.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="manager-loading">Loading movement patterns...</div>;
  }

  return (
    <div className="manager">
      <div className="manager-header">
        <h2 className="manager-title">Movement Patterns</h2>
        <div className="manager-actions">
          <input
            type="text"
            placeholder="Search patterns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="manager-search"
          />
          <button className="btn btn-primary" onClick={handleCreate}>
            + New Pattern
          </button>
        </div>
      </div>

      {showForm && (
        <div className="manager-form-overlay">
          <div className="manager-form-container">
            <div className="manager-form-header">
              <h3>{editingPattern ? 'Edit Movement Pattern' : 'New Movement Pattern'}</h3>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="manager-form">
              <div className="form-group">
                <label className="form-label">Pattern Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="form-input"
                  placeholder="e.g., Push, Pull, Squat, Hinge"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="form-textarea"
                  placeholder="Describe this movement pattern..."
                  rows={2}
                />
              </div>
              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label">Exercises</label>
                  <select
                    className="form-select add-exercise-select"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        addExerciseToForm(parseInt(e.target.value));
                      }
                    }}
                  >
                    <option value="">+ Add exercise...</option>
                    {getAvailableExercisesForForm().map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.name}</option>
                    ))}
                  </select>
                </div>
                {formSelectedExercises.length === 0 ? (
                  <div className="form-empty-list">
                    No exercises added yet. Select exercises from the dropdown above.
                  </div>
                ) : (
                  <div className="form-exercise-list">
                    {formSelectedExercises.map(exId => {
                      const exercise = exercises.find(ex => ex.id === exId);
                      if (!exercise) return null;
                      return (
                        <div key={exId} className="form-exercise-item">
                          <span>{exercise.name}</span>
                          <button
                            type="button"
                            className="btn-remove-small"
                            onClick={() => removeExerciseFromForm(exId)}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingPattern ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="manager-list">
        {filteredPatterns.length === 0 ? (
          <div className="manager-empty">
            {searchQuery ? 'No patterns match your search.' : 'No movement patterns yet. Create your first pattern!'}
          </div>
        ) : (
          <div className="simple-list">
            {filteredPatterns.map((pattern) => {
              const patternExercises = getExercisesForPattern(pattern.id);
              const isExpanded = expandedPatterns.has(pattern.id);
              
              return (
                <div key={pattern.id} className="simple-list-item expandable">
                  <div className="item-main" onClick={() => toggleExpanded(pattern.id)}>
                    <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                    <div className="item-content">
                      <span className="item-name">{pattern.name}</span>
                      {pattern.description && (
                        <span className="item-description">{pattern.description}</span>
                      )}
                      <span className="item-count">{patternExercises.length} exercise{patternExercises.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="item-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="btn-icon" onClick={() => handleEdit(pattern)} title="Edit">
                        ✏️
                      </button>
                      <button className="btn-icon danger" onClick={() => handleDelete(pattern)} title="Delete">
                        🗑️
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="item-children">
                      {patternExercises.map(ex => (
                        <div key={ex.id} className="child-item">
                          <span>{ex.name}</span>
                          <button
                            className="btn-remove-small"
                            onClick={() => removeExerciseFromPattern(ex.id)}
                            title="Remove from pattern"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      
                      {addingExerciseToPattern === pattern.id ? (
                        <div className="add-exercise-row">
                          <select
                            className="form-select"
                            onChange={(e) => {
                              if (e.target.value) {
                                addExerciseToPattern(parseInt(e.target.value), pattern.id);
                              }
                            }}
                            autoFocus
                          >
                            <option value="">Select exercise to add...</option>
                            {getUnassignedExercises(pattern.id).map(ex => (
                              <option key={ex.id} value={ex.id}>{ex.name}</option>
                            ))}
                          </select>
                          <button
                            className="btn-remove-small"
                            onClick={() => setAddingExerciseToPattern(null)}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-add-exercise"
                          onClick={() => setAddingExerciseToPattern(pattern.id)}
                        >
                          + Add Exercise
                        </button>
                      )}
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

