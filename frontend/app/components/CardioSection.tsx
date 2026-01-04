'use client';

import type { Cardio, CardioExercise } from '../types';

interface CardioSectionProps {
  cardio?: Cardio[];
  onAdd?: () => void;
  onDelete?: (cardioIndex: number) => void;
  onCopyToToday?: () => void;
}

export default function CardioSection({ cardio, onAdd, onDelete, onCopyToToday }: CardioSectionProps) {
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getCardioDetails = (exercise: CardioExercise) => {
    const details: string[] = [];
    
    if (exercise.duration_minutes) {
      details.push(`${exercise.duration_minutes} min`);
    }

    switch (exercise.type) {
      case 'incline_walking':
        details.push(`${exercise.speed} mph @ ${exercise.incline}% incline`);
        break;
      case 'sprints':
        details.push(`${exercise.num_sprints} sprints`);
        if (exercise.sprint_duration_seconds) {
          details.push(`${exercise.sprint_duration_seconds}s each`);
        }
        break;
      case 'running':
        if (exercise.distance) details.push(`${exercise.distance} mi`);
        if (exercise.pace) details.push(`${exercise.pace}/mi pace`);
        break;
      case 'cycling':
        if (exercise.distance) details.push(`${exercise.distance} mi`);
        if (exercise.resistance) details.push(`Level ${exercise.resistance}`);
        break;
      case 'swimming':
        if (exercise.laps) details.push(`${exercise.laps} laps`);
        if (exercise.stroke) details.push(exercise.stroke);
        break;
      case 'other':
        details.push(exercise.description);
        break;
    }

    return details.join(' • ');
  };

  const getCardioIcon = (type: string) => {
    switch (type) {
      case 'incline_walking':
      case 'walking':
        return '🚶';
      case 'running':
      case 'sprints':
        return '🏃';
      case 'cycling':
        return '🚴';
      case 'swimming':
        return '🏊';
      default:
        return '🏃';
    }
  };

  if (!cardio || cardio.length === 0) {
    return (
      <div className="section-card">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🏃</span>
            Cardio
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onAdd && (
              <button className="section-add-btn" onClick={onAdd} aria-label="Add cardio">
                +
              </button>
            )}
          </div>
        </div>
        <div className="section-empty">
          <span className="section-empty-icon">❤️</span>
          <span>No cardio recorded</span>
        </div>
      </div>
    );
  }

  const totalMinutes = cardio.reduce((sum, c) => sum + (c.exercise.duration_minutes || 0), 0);

  return (
    <div className="section-card">
      <div className="section-header">
        <div className="section-title">
          <span className="section-icon">🏃</span>
          Cardio
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="section-badge">{totalMinutes} min total</span>
          {onCopyToToday && (
            <button className="section-copy-btn" onClick={onCopyToToday} aria-label="Copy cardio to today" title="Copy to today">
              📋
            </button>
          )}
          {onAdd && (
            <button className="section-add-btn" onClick={onAdd} aria-label="Add cardio">
              +
            </button>
          )}
        </div>
      </div>
      <div className="section-content">
        {cardio.map((c, idx) => (
          <div key={c.id} className="data-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{getCardioIcon(c.exercise.type)}</span>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>
                  {formatTime(c.time)}
                </span>
                {onDelete && (
                  <button
                    className="btn-delete-small"
                    onClick={() => onDelete(idx)}
                    title="Remove cardio"
                  >
                    ×
                  </button>
                )}
              </span>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {getCardioDetails(c.exercise)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

