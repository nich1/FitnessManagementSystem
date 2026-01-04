'use client';

import { useState, useRef, useEffect } from 'react';
import type { Activity } from '../types';

interface ActivitiesSectionProps {
  activities?: Activity[];
  onAdd?: () => void;
  onDelete?: (index: number) => void;
  onSetChange?: (activityId: number, exerciseId: number, setId: number, field: 'reps' | 'weight' | 'rir', value: number | undefined) => void;
  onExerciseReorder?: (activityId: number, fromIndex: number, toIndex: number) => void;
  onTimeChange?: (activityId: number, newTime: string) => void;
  onAddExercise?: (activityId: number) => void;
  onExerciseDelete?: (activityId: number, exerciseIndex: number) => void;
  onSessionNotesChange?: (activityId: number, exerciseId: number, notes: string) => void;
  onAddSet?: (activityId: number, exerciseId: number) => void;
  onDeleteSet?: (activityId: number, exerciseId: number, setId: number) => void;
  onCopyToToday?: () => void;
}

interface DragState {
  activityId: number;
  exerciseIndex: number;
}

export default function ActivitiesSection({ activities, onAdd, onDelete, onSetChange, onExerciseReorder, onTimeChange, onAddExercise, onExerciseDelete, onSessionNotesChange, onAddSet, onDeleteSet, onCopyToToday }: ActivitiesSectionProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<{ activityId: number; exerciseIndex: number } | null>(null);
  const [editingTimeId, setEditingTimeId] = useState<number | null>(null);
  const [editTimeValue, setEditTimeValue] = useState<string>('');
  const [showNotes, setShowNotes] = useState(false);
  const timeInputRef = useRef<HTMLInputElement>(null);

  // Check if there are any notes to show
  const hasAnyNotes = activities?.some(a => 
    a.notes || 
    a.workout?.description ||
    a.exercises.some(ex => 
      ex.session_notes || 
      ex.exercise.notes ||
      ex.sets.some(s => s.notes)
    )
  ) ?? false;

  const handleDragStart = (activityId: number, exerciseIndex: number) => {
    setDragState({ activityId, exerciseIndex });
  };

  const handleDragEnd = () => {
    setDragState(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, activityId: number, exerciseIndex: number) => {
    e.preventDefault();
    // Only allow drag over if same activity
    if (dragState && dragState.activityId === activityId) {
      setDragOverIndex({ activityId, exerciseIndex });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, activityId: number, toIndex: number) => {
    e.preventDefault();
    if (dragState && dragState.activityId === activityId && onExerciseReorder) {
      const fromIndex = dragState.exerciseIndex;
      if (fromIndex !== toIndex) {
        onExerciseReorder(activityId, fromIndex, toIndex);
      }
    }
    setDragState(null);
    setDragOverIndex(null);
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getTimeInputValue = (timeStr: string) => {
    const date = new Date(timeStr);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const startEditingTime = (activityId: number, currentTime: string) => {
    setEditingTimeId(activityId);
    setEditTimeValue(getTimeInputValue(currentTime));
  };

  const cancelEditingTime = () => {
    setEditingTimeId(null);
    setEditTimeValue('');
  };

  const confirmEditingTime = (activityId: number, originalTime: string) => {
    if (!onTimeChange || !editTimeValue) {
      cancelEditingTime();
      return;
    }

    // Parse the original timestamp to get the date part
    const originalDate = new Date(originalTime);
    const [hours, minutes] = editTimeValue.split(':').map(Number);
    
    // Create new timestamp with same date but new time
    originalDate.setHours(hours, minutes, 0, 0);
    const newTimestamp = originalDate.toISOString();
    
    onTimeChange(activityId, newTimestamp);
    cancelEditingTime();
  };

  const handleTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, activityId: number, originalTime: string) => {
    if (e.key === 'Enter') {
      confirmEditingTime(activityId, originalTime);
    } else if (e.key === 'Escape') {
      cancelEditingTime();
    }
  };

  // Focus time input when editing starts
  useEffect(() => {
    if (editingTimeId !== null && timeInputRef.current) {
      timeInputRef.current.focus();
    }
  }, [editingTimeId]);

  if (!activities || activities.length === 0) {
    return (
      <div className="section-card">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">💪</span>
            Workouts
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onAdd && (
              <button className="section-add-btn" onClick={onAdd} aria-label="Add workout">
                +
              </button>
            )}
          </div>
        </div>
        <div className="section-empty">
          <span className="section-empty-icon">🏋️</span>
          <span>No workouts recorded</span>
        </div>
      </div>
    );
  }

  const totalSets = activities.reduce((sum, a) => sum + a.exercises.reduce((s, e) => s + e.sets.length, 0), 0);

  return (
    <div className="section-card">
      <div className="section-header">
        <div className="section-title">
          <span className="section-icon">💪</span>
          Workouts
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="section-badge">{totalSets} sets</span>
          {hasAnyNotes && (
            <button
              className={`notes-toggle-btn ${showNotes ? 'active' : ''}`}
              onClick={() => setShowNotes(!showNotes)}
              title={showNotes ? 'Hide notes' : 'Show notes'}
              aria-label={showNotes ? 'Hide notes' : 'Show notes'}
            >
              📝
            </button>
          )}
          {onCopyToToday && (
            <button className="section-copy-btn" onClick={onCopyToToday} aria-label="Copy workouts to today" title="Copy to today">
              📋
            </button>
          )}
          {onAdd && (
            <button className="section-add-btn" onClick={onAdd} aria-label="Add workout">
              +
            </button>
          )}
        </div>
      </div>
      <div className="section-content">
        {activities.map((activity, index) => (
          <div key={activity.id} className="workout-card">
            <div className="workout-header">
              {editingTimeId === activity.id ? (
                <input
                  ref={timeInputRef}
                  type="time"
                  className="workout-time-input"
                  value={editTimeValue}
                  onChange={(e) => setEditTimeValue(e.target.value)}
                  onBlur={() => confirmEditingTime(activity.id, activity.time)}
                  onKeyDown={(e) => handleTimeKeyDown(e, activity.id, activity.time)}
                />
              ) : (
                <span 
                  className={`workout-time ${onTimeChange ? 'editable' : ''}`}
                  onClick={() => onTimeChange && startEditingTime(activity.id, activity.time)}
                  title={onTimeChange ? 'Click to edit time' : undefined}
                >
                  {formatTime(activity.time)}
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="workout-sets-count">
                  {activity.exercises.reduce((s, e) => s + e.sets.length, 0)} sets
                </span>
                {onDelete && (
                  <button
                    className="btn-delete-small"
                    onClick={() => onDelete(index)}
                    aria-label="Delete activity"
                    title="Remove workout"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            {showNotes && (activity.workout?.description || activity.notes) && (
              <div className="workout-description-section">
                {activity.workout?.description && (
                  <div className="workout-template-description">
                    <span className="notes-label">Workout Description:</span>
                    <span>{activity.workout.description}</span>
                  </div>
                )}
                {activity.notes && (
                  <div className="workout-session-notes">
                    <span className="notes-label">Session Notes:</span>
                    <span>{activity.notes}</span>
                  </div>
                )}
              </div>
            )}
            <div className="workout-exercises">
              {activity.exercises.map((actEx, exerciseIndex) => (
                <div
                  key={actEx.id}
                  className={`exercise-group ${
                    dragState?.activityId === activity.id && dragState?.exerciseIndex === exerciseIndex ? 'dragging' : ''
                  } ${
                    dragOverIndex?.activityId === activity.id && dragOverIndex?.exerciseIndex === exerciseIndex ? 'drag-over' : ''
                  }`}
                  draggable={!!onExerciseReorder}
                  onDragStart={() => handleDragStart(activity.id, exerciseIndex)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, activity.id, exerciseIndex)}
                  onDrop={(e) => handleDrop(e, activity.id, exerciseIndex)}
                >
                  <div className="exercise-header">
                    <div className="exercise-header-left">
                      {onExerciseReorder && (
                        <span className="exercise-drag-handle" title="Drag to reorder">⋮⋮</span>
                      )}
                      <span className="exercise-name">{actEx.exercise.name}</span>
                      {actEx.exercise.notes && (
                        <button 
                          className="exercise-notes-hint"
                          onClick={() => setShowNotes(!showNotes)}
                          title={showNotes ? 'Hide notes' : 'Click to show notes'}
                        >
                          ℹ️
                        </button>
                      )}
                    </div>
                    {onExerciseDelete && (
                      <button
                        className="btn-delete-exercise"
                        onClick={() => onExerciseDelete(activity.id, exerciseIndex)}
                        aria-label={`Delete ${actEx.exercise.name}`}
                        title="Remove exercise"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {showNotes && (
                    <div className="exercise-notes-section">
                      {actEx.exercise.notes && (
                        <div className="exercise-definition-notes">
                          <span className="notes-label">Instructions:</span>
                          <span>{actEx.exercise.notes}</span>
                        </div>
                      )}
                      <div className="session-notes-editable">
                        <span className="notes-label">Session notes:</span>
                        {onSessionNotesChange ? (
                          <input
                            type="text"
                            className="session-notes-input"
                            value={actEx.session_notes || ''}
                            placeholder="Add notes for today..."
                            onChange={(e) => onSessionNotesChange(activity.id, actEx.id, e.target.value)}
                          />
                        ) : (
                          <span>{actEx.session_notes || 'No notes'}</span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="workout-sets">
                    {actEx.sets.map((set, setIndex) => (
                      <div key={set.id} className="set-item">
                        <span className="set-number">{setIndex + 1}</span>
                        <label className="set-reps">
                          <input
                            type="number"
                            className="set-inline-input"
                            value={set.reps}
                            min={0}
                            onChange={(e) => {
                              const val = e.target.value;
                              onSetChange?.(activity.id, actEx.id, set.id, 'reps', val === '' ? undefined : parseInt(val, 10) || 0);
                            }}
                            aria-label="Reps"
                          />
                          <span className="set-inline-suffix">reps</span>
                        </label>
                        <label className="set-weight">
                          <input
                            type="number"
                            className="set-inline-input"
                            value={set.weight}
                            min={0}
                            step="any"
                            onChange={(e) => {
                              const val = e.target.value;
                              onSetChange?.(activity.id, actEx.id, set.id, 'weight', val === '' ? undefined : parseFloat(val) || 0);
                            }}
                            aria-label="Weight"
                          />
                          <span className="set-inline-suffix">{set.unit || 'lb'}</span>
                        </label>
                        <label className="set-rir">
                          <input
                            type="number"
                            className="set-inline-input"
                            value={set.rir ?? ''}
                            min={0}
                            max={10}
                            onChange={(e) => {
                              const val = e.target.value;
                              onSetChange?.(activity.id, actEx.id, set.id, 'rir', val === '' ? undefined : parseInt(val, 10) || 0);
                            }}
                            aria-label="RIR"
                          />
                          <span className="set-inline-suffix">RIR</span>
                        </label>
                        {showNotes && set.notes && <span className="set-notes">{set.notes}</span>}
                        {onDeleteSet && (
                          <button
                            className="btn-delete-set"
                            onClick={() => onDeleteSet(activity.id, actEx.id, set.id)}
                            aria-label="Delete set"
                            title="Remove set"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {onAddSet && (
                      <button
                        className="btn-add-set"
                        onClick={() => onAddSet(activity.id, actEx.id)}
                        title="Add set"
                      >
                        + Set
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {onAddExercise && (
              <button
                className="add-exercise-btn"
                onClick={() => onAddExercise(activity.id)}
                title="Add exercise to this workout"
              >
                + Add Exercise
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
