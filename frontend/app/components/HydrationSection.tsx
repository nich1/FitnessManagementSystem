'use client';

import type { Hydration } from '../types';

interface HydrationSectionProps {
  hydration?: Hydration[];
  onAdd?: () => void;
  onDelete?: (index: number) => void;
  onEdit?: (index: number) => void;
}

export default function HydrationSection({ hydration, onAdd, onDelete, onEdit }: HydrationSectionProps) {
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!hydration || hydration.length === 0) {
    return (
      <div className="section-card">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">💧</span>
            Hydration
          </div>
          {onAdd && (
            <button className="section-add-btn" onClick={onAdd} aria-label="Add hydration">
              +
            </button>
          )}
        </div>
        <div className="section-empty">
          <span className="section-empty-icon">🚰</span>
          <span>No hydration recorded</span>
        </div>
      </div>
    );
  }

  // Calculate total across all hydration entries
  const totalAmount = hydration.reduce((sum, h) => sum + (h.cup.amount * h.servings), 0);
  // Get the most common unit (first entry's unit for simplicity)
  const displayUnit = hydration[0]?.cup.unit || 'ml';

  return (
    <div className="section-card">
      <div className="section-header">
        <div className="section-title">
          <span className="section-icon">💧</span>
          Hydration
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="section-badge">{Math.round(totalAmount)} {displayUnit} total</span>
          {onAdd && (
            <button className="section-add-btn" onClick={onAdd} aria-label="Add hydration">
              +
            </button>
          )}
        </div>
      </div>
      <div className="section-content">
        <div className="hydration-display" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
          <span className="hydration-icon">💧</span>
          <div>
            <span className="hydration-amount">{Math.round(totalAmount)}</span>
            <span className="hydration-unit">{displayUnit}</span>
          </div>
        </div>
        
        <div className="hydration-list">
          {hydration.map((h, idx) => {
            const amount = h.cup.amount * h.servings;
            return (
              <div key={h.id} className="hydration-item">
                <div className="hydration-item-info">
                  <span className="hydration-item-name">{h.cup.name}</span>
                  <span className="hydration-item-details">
                    {h.servings}× • {Math.round(amount)} {h.cup.unit}
                  </span>
                </div>
                <div className="hydration-item-actions">
                  <span className="hydration-item-time">{formatTime(h.timestamp)}</span>
                  {onEdit && (
                    <button
                      className="btn-edit-small"
                      onClick={() => onEdit(idx)}
                      title="Edit servings"
                    >
                      ✎
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="btn-delete-small"
                      onClick={() => onDelete(idx)}
                      title="Remove"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

