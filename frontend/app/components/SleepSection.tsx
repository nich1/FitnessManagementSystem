'use client';

import type { Sleep } from '../types';

interface SleepSectionProps {
  sleep?: Sleep;
  onAdd?: () => void;
  onDelete?: () => void;
}

export default function SleepSection({ sleep, onAdd, onDelete }: SleepSectionProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getQualityClass = (quality: number) => {
    if (quality >= 8) return 'excellent';
    if (quality >= 6) return 'good';
    if (quality >= 4) return 'average';
    return 'poor';
  };

  if (!sleep) {
    return (
      <div className="section-card">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">😴</span>
            Sleep
          </div>
          {onAdd && (
            <button className="section-add-btn" onClick={onAdd} aria-label="Add sleep">
              +
            </button>
          )}
        </div>
        <div className="section-empty">
          <span className="section-empty-icon">💤</span>
          <span>No sleep data recorded</span>
        </div>
      </div>
    );
  }

  const totalNapTime = sleep.naps.reduce((sum, nap) => sum + nap.duration, 0);

  return (
    <div className="section-card">
      <div className="section-header">
        <div className="section-title">
          <span className="section-icon">😴</span>
          Sleep
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="section-badge">{formatDuration(sleep.duration)}</span>
          {onAdd && (
            <button className="section-add-btn" onClick={onAdd} aria-label="Edit sleep">
              ✎
            </button>
          )}
          {onDelete && (
            <button className="btn-delete-small" onClick={onDelete} title="Remove sleep">
              ×
            </button>
          )}
        </div>
      </div>
      <div className="section-content">
        <div className="data-item">
          <span className="data-item-label">Duration</span>
          <span className="data-item-value highlight">{formatDuration(sleep.duration)}</span>
        </div>
        <div className="data-item">
          <span className="data-item-label">Quality</span>
          <div className="quality-meter">
            <div className="quality-bar">
              <div
                className={`quality-fill ${getQualityClass(sleep.quality)}`}
                style={{ width: `${sleep.quality * 10}%` }}
              />
            </div>
            <span className="data-item-value">{sleep.quality}/10</span>
          </div>
        </div>
        {sleep.naps.length > 0 && (
          <div className="data-item">
            <span className="data-item-label">Naps ({sleep.naps.length})</span>
            <span className="data-item-value">{formatDuration(totalNapTime)}</span>
          </div>
        )}
        {sleep.notes && (
          <div className="notes-content" style={{ marginTop: '0.75rem' }}>
            {sleep.notes}
          </div>
        )}
      </div>
    </div>
  );
}

