'use client';

import type { Stress, StressLevel } from '../types';

interface StressSectionProps {
  stress?: Stress;
  onAdd?: () => void;
}

export default function StressSection({ stress, onAdd }: StressSectionProps) {
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStressLabel = (level: StressLevel) => {
    const labels: Record<StressLevel, string> = {
      very_low: 'Very Low',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      very_high: 'Very High',
    };
    return labels[level];
  };

  const getStressEmoji = (level: StressLevel) => {
    const emojis: Record<StressLevel, string> = {
      very_low: '😌',
      low: '🙂',
      medium: '😐',
      high: '😰',
      very_high: '😫',
    };
    return emojis[level];
  };

  if (!stress) {
    return (
      <div className="section-card">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🧠</span>
            Stress
          </div>
          {onAdd && (
            <button className="section-add-btn" onClick={onAdd} aria-label="Add stress">
              +
            </button>
          )}
        </div>
        <div className="section-empty">
          <span className="section-empty-icon">😌</span>
          <span>No stress data recorded</span>
        </div>
      </div>
    );
  }

  return (
    <div className="section-card">
      <div className="section-header">
        <div className="section-title">
          <span className="section-icon">🧠</span>
          Stress
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="section-badge">{formatTime(stress.timestamp)}</span>
          {onAdd && (
            <button className="section-add-btn" onClick={onAdd} aria-label="Edit stress">
              ✎
            </button>
          )}
        </div>
      </div>
      <div className="section-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
          <div className={`stress-level ${stress.level}`}>
            <span>{getStressEmoji(stress.level)}</span>
            <span>{getStressLabel(stress.level)}</span>
          </div>
        </div>
        {stress.notes && <div className="notes-content">{stress.notes}</div>}
      </div>
    </div>
  );
}

