'use client';

import { useState, useEffect } from 'react';
import type { Mesocycle, MicrocycleRequest, Workout } from '../../types';
import { mesocycleApi, workoutApi } from '../../api';
import { useConfirmDialog } from '../ConfirmDialog';

interface FormMicrocycle {
  name: string;
  description: string;
  workout_ids: number[];
}

export default function MesocycleManager() {
  const [mesocycles, setMesocycles] = useState<Mesocycle[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMesocycle, setEditingMesocycle] = useState<Mesocycle | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    microcycles: [{ name: 'Microcycle 1', description: '', workout_ids: [] }] as FormMicrocycle[],
  });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMesocycle, setExpandedMesocycle] = useState<number | null>(null);
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  
  // Duplication dialog state
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateIndex, setDuplicateIndex] = useState<number | null>(null);
  const [duplicateCount, setDuplicateCount] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load workouts first (these are required for the form)
      const workoutsData = await workoutApi.getAll();
      setWorkouts(workoutsData);
    } catch (error) {
      console.error('Failed to load workouts:', error);
    }

    try {
      // Load mesocycles separately (backend might not have this endpoint yet)
      const mesocyclesData = await mesocycleApi.getAll();
      setMesocycles(mesocyclesData);
    } catch (error) {
      console.error('Failed to load mesocycles:', error);
      // This is expected if backend endpoint doesn't exist yet
    }

    setLoading(false);
  };

  const handleCreate = () => {
    setEditingMesocycle(null);
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 28); // 4 weeks default
    
    setFormData({
      name: '',
      description: '',
      start_date: today.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      microcycles: [{ name: 'Microcycle 1', description: '', workout_ids: [] }],
    });
    setShowForm(true);
  };

  const handleEdit = (mesocycle: Mesocycle) => {
    setEditingMesocycle(mesocycle);
    setFormData({
      name: mesocycle.name,
      description: mesocycle.description || '',
      start_date: mesocycle.start_date,
      end_date: mesocycle.end_date,
      microcycles: mesocycle.microcycles.map(m => ({
        name: m.name,
        description: m.description || '',
        workout_ids: m.workouts.map(w => w.id),
      })),
    });
    setShowForm(true);
  };

  const handleDelete = async (mesocycle: Mesocycle) => {
    const confirmed = await confirm({
      title: 'Delete Mesocycle',
      message: `Are you sure you want to delete "${mesocycle.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await mesocycleApi.delete(mesocycle.id);
      setMesocycles(mesocycles.filter(m => m.id !== mesocycle.id));
    } catch (error) {
      console.error('Failed to delete mesocycle:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.microcycles.length === 0) return;

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        start_date: formData.start_date,
        end_date: formData.end_date,
        microcycles: formData.microcycles.map((m, index) => ({
          name: m.name,
          position: index,
          description: m.description || undefined,
          workout_ids: m.workout_ids,
        })),
      };

      if (editingMesocycle) {
        const updated = await mesocycleApi.update(editingMesocycle.id, payload);
        setMesocycles(mesocycles.map(m => m.id === editingMesocycle.id ? updated : m));
      } else {
        const created = await mesocycleApi.create(payload);
        setMesocycles([...mesocycles, created]);
      }

      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save mesocycle:', error);
      alert('Failed to save mesocycle');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      microcycles: [{ name: 'Microcycle 1', description: '', workout_ids: [] }],
    });
    setEditingMesocycle(null);
  };

  const addMicrocycle = () => {
    const nextNum = formData.microcycles.length + 1;
    setFormData({
      ...formData,
      microcycles: [...formData.microcycles, { name: `Microcycle ${nextNum}`, description: '', workout_ids: [] }],
    });
  };

  const openDuplicateDialog = (index: number) => {
    setDuplicateIndex(index);
    setDuplicateCount(1);
    setShowDuplicateDialog(true);
  };

  const closeDuplicateDialog = () => {
    setShowDuplicateDialog(false);
    setDuplicateIndex(null);
    setDuplicateCount(1);
  };

  const duplicateMicrocycle = () => {
    if (duplicateIndex === null) return;
    
    const microcycleToDuplicate = formData.microcycles[duplicateIndex];
    const newMicrocycles = [...formData.microcycles];
    
    // Create multiple duplicates
    for (let i = 0; i < duplicateCount; i++) {
      // Smart naming: if name ends with a number, increment it
      const lastMicrocycle = newMicrocycles[duplicateIndex + i];
      const nameMatch = lastMicrocycle.name.match(/^(.+?)(\d+)$/);
      let newName: string;
      if (nameMatch) {
        const prefix = nameMatch[1]; // e.g., "Microcycle " or "Week "
        const num = parseInt(nameMatch[2], 10);
        newName = `${prefix}${num + 1}`;
      } else {
        newName = `${microcycleToDuplicate.name} (Copy ${i + 1})`;
      }
      
      const newMicrocycle = {
        name: newName,
        description: microcycleToDuplicate.description,
        workout_ids: [...microcycleToDuplicate.workout_ids], // Copy the array
      };
      newMicrocycles.splice(duplicateIndex + i + 1, 0, newMicrocycle); // Insert after the previous
    }
    setFormData({ ...formData, microcycles: newMicrocycles });
    closeDuplicateDialog();
  };

  const removeMicrocycle = (index: number) => {
    if (formData.microcycles.length <= 1) return;
    setFormData({
      ...formData,
      microcycles: formData.microcycles.filter((_, i) => i !== index),
    });
  };

  const updateMicrocycle = (index: number, field: keyof FormMicrocycle, value: string | number[]) => {
    const newMicrocycles = [...formData.microcycles];
    newMicrocycles[index] = { ...newMicrocycles[index], [field]: value };
    setFormData({ ...formData, microcycles: newMicrocycles });
  };

  const addWorkoutToMicrocycle = (microcycleIndex: number, workoutId: number) => {
    const newMicrocycles = [...formData.microcycles];
    // Allow duplicates - same workout can be added multiple times
    newMicrocycles[microcycleIndex].workout_ids = [
      ...newMicrocycles[microcycleIndex].workout_ids,
      workoutId,
    ];
    setFormData({ ...formData, microcycles: newMicrocycles });
  };

  const removeWorkoutFromMicrocycle = (microcycleIndex: number, workoutIndex: number) => {
    const newMicrocycles = [...formData.microcycles];
    // Remove by index (not by id) since duplicates are allowed
    newMicrocycles[microcycleIndex].workout_ids = newMicrocycles[microcycleIndex].workout_ids.filter(
      (_, idx) => idx !== workoutIndex
    );
    setFormData({ ...formData, microcycles: newMicrocycles });
  };

  const reorderWorkoutsInMicrocycle = (microcycleIndex: number, fromIndex: number, toIndex: number) => {
    const newMicrocycles = [...formData.microcycles];
    const workoutIds = [...newMicrocycles[microcycleIndex].workout_ids];
    const [movedWorkout] = workoutIds.splice(fromIndex, 1);
    workoutIds.splice(toIndex, 0, movedWorkout);
    newMicrocycles[microcycleIndex].workout_ids = workoutIds;
    setFormData({ ...formData, microcycles: newMicrocycles });
  };

  // Drag and drop state
  const [dragState, setDragState] = useState<{
    microcycleIndex: number;
    workoutIndex: number;
  } | null>(null);

  const handleDragStart = (microcycleIndex: number, workoutIndex: number) => {
    setDragState({ microcycleIndex, workoutIndex });
  };

  const handleDragOver = (e: React.DragEvent, microcycleIndex: number, workoutIndex: number) => {
    e.preventDefault();
    if (!dragState) return;
    // Only allow reordering within the same microcycle
    if (dragState.microcycleIndex !== microcycleIndex) return;
    if (dragState.workoutIndex === workoutIndex) return;
    
    reorderWorkoutsInMicrocycle(microcycleIndex, dragState.workoutIndex, workoutIndex);
    setDragState({ microcycleIndex, workoutIndex });
  };

  const handleDragEnd = () => {
    setDragState(null);
  };

  // Special ID for rest day (hardcoded workout with 0 exercises)
  const REST_DAY_ID = 0;
  
  const getWorkoutById = (id: number) => {
    if (id === REST_DAY_ID) {
      return { id: REST_DAY_ID, name: 'Rest Day', description: 'Recovery day', items: [] };
    }
    return workouts.find(w => w.id === id);
  };
  
  const isRestDay = (id: number) => id === REST_DAY_ID;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    if (weeks === 0) return `${days} days`;
    if (days === 0) return `${weeks} weeks`;
    return `${weeks} weeks, ${days} days`;
  };

  const filteredMesocycles = mesocycles.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="manager-loading">Loading mesocycles...</div>;
  }

  return (
    <div className="manager">
      <div className="manager-header">
        <h2 className="manager-title">📊 Mesocycles</h2>
        <div className="manager-actions">
          <input
            type="text"
            placeholder="Search mesocycles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="manager-search"
          />
          <button className="btn btn-primary" onClick={handleCreate}>
            + New Mesocycle
          </button>
        </div>
      </div>

      <p className="manager-hint">
        Plan your training blocks. Each mesocycle contains microcycles (weeks), and each microcycle has workouts assigned to it.
      </p>

      {showForm && (
        <div className="manager-form-overlay">
          <div className="manager-form-container large">
            <div className="manager-form-header">
              <h3>{editingMesocycle ? 'Edit Mesocycle' : 'New Mesocycle'}</h3>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="manager-form">
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Mesocycle Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                    placeholder="e.g., Hypertrophy Block, Strength Phase"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-textarea"
                  placeholder="Optional description of the training block..."
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">End Date *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label">Microcycles</label>
                  <button type="button" className="btn btn-small btn-secondary" onClick={addMicrocycle}>
                    + Add Microcycle
                  </button>
                </div>

                <div className="mesocycle-microcycles">
                  {formData.microcycles.map((microcycle, microcycleIndex) => (
                    <div key={microcycleIndex} className="microcycle-card">
                      <div className="microcycle-header">
                        <div className="microcycle-title-row">
                          <input
                            type="text"
                            value={microcycle.name}
                            onChange={(e) => updateMicrocycle(microcycleIndex, 'name', e.target.value)}
                            className="form-input microcycle-name-input"
                            placeholder="Microcycle name"
                          />
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => openDuplicateDialog(microcycleIndex)}
                            title="Duplicate microcycle"
                          >
                            📋
                          </button>
                          {formData.microcycles.length > 1 && (
                            <button
                              type="button"
                              className="btn-icon danger"
                              onClick={() => removeMicrocycle(microcycleIndex)}
                              title="Remove microcycle"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={microcycle.description}
                          onChange={(e) => updateMicrocycle(microcycleIndex, 'description', e.target.value)}
                          className="form-input microcycle-description-input"
                          placeholder="Week focus/notes (optional)"
                        />
                      </div>

                      <div className="microcycle-workouts">
                        <div className="microcycle-workouts-header">
                          <span className="workouts-label">Days ({microcycle.workout_ids.length})</span>
                          <select
                            className="form-select workout-add-select"
                            value=""
                            onChange={(e) => {
                              if (e.target.value !== '') {
                                addWorkoutToMicrocycle(microcycleIndex, parseInt(e.target.value));
                              }
                            }}
                          >
                            <option value="">+ Add Day</option>
                            <option value={REST_DAY_ID}>🛌 Rest Day</option>
                            {workouts.map(w => (
                              <option key={w.id} value={w.id}>🏆 {w.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        {microcycle.workout_ids.length === 0 ? (
                          <div className="microcycle-empty">No days assigned. Add workouts or rest days.</div>
                        ) : (
                          <div className="microcycle-workout-list">
                            {microcycle.workout_ids.map((workoutId, workoutIndex) => {
                              const workout = getWorkoutById(workoutId);
                              const isDragging = dragState?.microcycleIndex === microcycleIndex && 
                                                 dragState?.workoutIndex === workoutIndex;
                              return (
                                <div 
                                  key={`${workoutId}-${workoutIndex}`} 
                                  className={`microcycle-workout-item ${isDragging ? 'dragging' : ''} ${isRestDay(workoutId) ? 'rest-day' : ''}`}
                                  draggable
                                  onDragStart={() => handleDragStart(microcycleIndex, workoutIndex)}
                                  onDragOver={(e) => handleDragOver(e, microcycleIndex, workoutIndex)}
                                  onDragEnd={handleDragEnd}
                                >
                                  <span className="workout-drag-handle" title="Drag to reorder">⋮⋮</span>
                                  <span className="workout-position">Day {workoutIndex + 1}</span>
                                  <span className="workout-icon">{isRestDay(workoutId) ? '🛌' : '🏆'}</span>
                                  <span className="workout-name">{workout?.name || 'Unknown'}</span>
                                  <button
                                    type="button"
                                    className="btn-icon-small danger"
                                    onClick={() => removeWorkoutFromMicrocycle(microcycleIndex, workoutIndex)}
                                    title="Remove day"
                                  >
                                    ✕
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingMesocycle ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="manager-list">
        {filteredMesocycles.length === 0 ? (
          <div className="manager-empty">
            {searchQuery ? 'No mesocycles match your search.' : 'No mesocycles yet. Create your first training block!'}
          </div>
        ) : (
          <div className="mesocycle-cards">
            {filteredMesocycles.map((mesocycle) => (
              <div key={mesocycle.id} className="mesocycle-card-display">
                <div 
                  className="mesocycle-card-header"
                  onClick={() => setExpandedMesocycle(expandedMesocycle === mesocycle.id ? null : mesocycle.id)}
                >
                  <div className="mesocycle-info">
                    <h3 className="mesocycle-name">{mesocycle.name}</h3>
                    {mesocycle.description && (
                      <p className="mesocycle-description">{mesocycle.description}</p>
                    )}
                    <div className="mesocycle-meta">
                      <span className="meta-item">
                        📅 {formatDate(mesocycle.start_date)} – {formatDate(mesocycle.end_date)}
                      </span>
                      <span className="meta-item">
                        ⏱️ {getDuration(mesocycle.start_date, mesocycle.end_date)}
                      </span>
                      <span className="meta-item">
                        🌀 {mesocycle.microcycles.length} microcycles
                      </span>
                    </div>
                  </div>
                  <div className="mesocycle-actions">
                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleEdit(mesocycle); }} title="Edit">
                      ✏️
                    </button>
                    <button className="btn-icon danger" onClick={(e) => { e.stopPropagation(); handleDelete(mesocycle); }} title="Delete">
                      🗑️
                    </button>
                    <span className="expand-icon">{expandedMesocycle === mesocycle.id ? '▲' : '▼'}</span>
                  </div>
                </div>
                
                {expandedMesocycle === mesocycle.id && (
                  <div className="mesocycle-card-body">
                    {mesocycle.microcycles.map((microcycle) => (
                      <div key={microcycle.id} className="microcycle-detail">
                        <div className="microcycle-detail-header">
                          <span className="microcycle-detail-name">{microcycle.name}</span>
                          {microcycle.description && (
                            <span className="microcycle-detail-desc">{microcycle.description}</span>
                          )}
                        </div>
                        <div className="microcycle-detail-workouts">
                          {microcycle.workouts.length === 0 ? (
                            <span className="no-workouts">No workouts</span>
                          ) : (
                            microcycle.workouts.map((workout, idx) => (
                              <div key={workout.id} className="microcycle-detail-workout">
                                <span className="workout-day">Day {idx + 1}:</span>
                                <span className="workout-name">{workout.name}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {ConfirmDialogComponent}

      {/* Duplicate Microcycle Dialog */}
      {showDuplicateDialog && (
        <div className="modal-overlay" onClick={closeDuplicateDialog}>
          <div className="modal-content modal-small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Duplicate Microcycle</h2>
              <button className="modal-close" onClick={closeDuplicateDialog}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Number of copies to create</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="52"
                  value={duplicateCount}
                  onChange={e => setDuplicateCount(Math.max(1, Math.min(52, parseInt(e.target.value) || 1)))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDuplicateDialog}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={duplicateMicrocycle}>
                Duplicate {duplicateCount > 1 ? `(${duplicateCount} copies)` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

