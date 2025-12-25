'use client';

import { useState, useEffect } from 'react';
import type { Exercise, MovementPattern } from '../../types';
import { exerciseApi, movementPatternApi } from '../../api';
import { useConfirmDialog } from '../ConfirmDialog';

export default function ExercisesManager() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [movementPatterns, setMovementPatterns] = useState<MovementPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMovementPatternId, setNewMovementPatternId] = useState<number | undefined>(undefined);
  const [newNotes, setNewNotes] = useState('');
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [exercisesData, patternsData] = await Promise.all([
        exerciseApi.getAll(),
        movementPatternApi.getAll()
      ]);
      setExercises(exercisesData);
      setMovementPatterns(patternsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingExercise(null);
    setNewName('');
    setNewMovementPatternId(undefined);
    setNewNotes('');
    setShowForm(true);
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setNewName(exercise.name);
    setNewMovementPatternId(exercise.movement_pattern_id);
    setNewNotes(exercise.notes || '');
    setShowForm(true);
  };

  const handleDelete = async (exercise: Exercise) => {
    const confirmed = await confirm({
      title: 'Delete Exercise',
      message: `Are you sure you want to delete "${exercise.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      await exerciseApi.delete(exercise.id);
      setExercises(exercises.filter(e => e.id !== exercise.id));
    } catch (error) {
      console.error('Failed to delete exercise:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setSaving(true);
    try {
      const data = {
        name: newName,
        movement_pattern_id: newMovementPatternId,
        notes: newNotes || undefined
      };
      
      if (editingExercise) {
        const updated = await exerciseApi.update(editingExercise.id, data);
        setExercises(exercises.map(ex => ex.id === editingExercise.id ? updated : ex));
      } else {
        const created = await exerciseApi.create(data);
        setExercises([...exercises, created]);
      }
      setShowForm(false);
      setNewName('');
      setNewMovementPatternId(undefined);
      setNewNotes('');
      setEditingExercise(null);
    } catch (error) {
      console.error('Failed to save exercise:', error);
      alert('Failed to save exercise');
    } finally {
      setSaving(false);
    }
  };

  const getMovementPatternName = (id?: number) => {
    if (!id) return null;
    const pattern = movementPatterns.find(p => p.id === id);
    return pattern?.name;
  };

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="manager-loading">Loading exercises...</div>;
  }

  return (
    <div className="manager">
      <div className="manager-header">
        <h2 className="manager-title">Exercises</h2>
        <div className="manager-actions">
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="manager-search"
          />
          <button className="btn btn-primary" onClick={handleCreate}>
            + New Exercise
          </button>
        </div>
      </div>

      {showForm && (
        <div className="manager-form-overlay">
          <div className="manager-form-container">
            <div className="manager-form-header">
              <h3>{editingExercise ? 'Edit Exercise' : 'New Exercise'}</h3>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="manager-form">
              <div className="form-group">
                <label className="form-label">Exercise Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="form-input"
                  placeholder="e.g., Bench Press, Squat, Deadlift"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Movement Pattern</label>
                <select
                  value={newMovementPatternId || ''}
                  onChange={(e) => setNewMovementPatternId(e.target.value ? Number(e.target.value) : undefined)}
                  className="form-select"
                >
                  <option value="">None</option>
                  {movementPatterns.map(pattern => (
                    <option key={pattern.id} value={pattern.id}>{pattern.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="form-textarea"
                  placeholder="Notes displayed when this exercise is added to workouts..."
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingExercise ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="manager-list">
        {filteredExercises.length === 0 ? (
          <div className="manager-empty">
            {searchQuery ? 'No exercises match your search.' : 'No exercises yet. Create your first exercise!'}
          </div>
        ) : (
          <div className="simple-list">
            {filteredExercises.map((exercise) => (
              <div key={exercise.id} className="simple-list-item">
                <div className="item-content">
                  <span className="item-name">{exercise.name}</span>
                  {getMovementPatternName(exercise.movement_pattern_id) && (
                    <span className="item-tag">{getMovementPatternName(exercise.movement_pattern_id)}</span>
                  )}
                  {exercise.notes && (
                    <span className="item-notes">{exercise.notes}</span>
                  )}
                </div>
                <div className="item-actions">
                  <button className="btn-icon" onClick={() => handleEdit(exercise)} title="Edit">
                    ✏️
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDelete(exercise)} title="Delete">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ConfirmDialogComponent}
    </div>
  );
}

