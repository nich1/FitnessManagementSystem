'use client';

import type { LogEntry, CarbCycleDayType } from '../types';

const DAY_TYPE_COLORS: Record<CarbCycleDayType, string> = {
  lowest: '#3b82f6',
  low: '#06b6d4',
  medium: '#10b981',
  high: '#f59e0b',
  highest: '#ef4444',
};

interface QuickStatsProps {
  logEntry?: LogEntry | null;
  onEdit?: () => void;
}

export default function QuickStats({ logEntry, onEdit }: QuickStatsProps) {
  return (
    <div className="section-card" style={{ gridColumn: '1 / -1' }}>
      <div className="section-header">
        <div className="section-title">
          <span className="section-icon">📊</span>
          Quick Stats
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {logEntry?.phase && <span className="section-badge">{logEntry.phase.name}</span>}
          {onEdit && (
            <button className="section-add-btn" onClick={onEdit} aria-label="Edit quick stats">
              ✎
            </button>
          )}
        </div>
      </div>
      <div className="section-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          {/* Morning Weight */}
          <div className="macro-item">
            <div className="macro-value" style={{ color: 'var(--text-primary)' }}>
              {logEntry?.morning_weight ? `${logEntry.morning_weight}` : '—'}
            </div>
            <div className="macro-label">Morning Weight (lb)</div>
          </div>

          {/* Alcohol */}
          <div className="macro-item">
            <div className="macro-value" style={{ color: logEntry?.num_standard_drinks ? 'var(--accent-warning)' : 'var(--text-muted)' }}>
              {logEntry?.num_standard_drinks ?? '0'}
            </div>
            <div className="macro-label">Drinks</div>
          </div>

          {/* Carb Cycle Day */}
          <div className="macro-item">
            {logEntry?.carb_cycle ? (
              <>
                <div className="macro-value" style={{ color: DAY_TYPE_COLORS[logEntry.carb_cycle.selected_day.day_type] }}>
                  {logEntry.carb_cycle.selected_day.carbs}g
                </div>
                <div className="macro-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                  <span 
                    className="carb-day-type-dot"
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: DAY_TYPE_COLORS[logEntry.carb_cycle.selected_day.day_type],
                      display: 'inline-block'
                    }}
                  />
                  {logEntry.carb_cycle.selected_day.day_type.charAt(0).toUpperCase() + logEntry.carb_cycle.selected_day.day_type.slice(1)} Carb
                </div>
              </>
            ) : (
              <>
                <div className="macro-value" style={{ color: 'var(--text-muted)' }}>—</div>
                <div className="macro-label">Carb Day</div>
              </>
            )}
          </div>

          {/* Workout Sets */}
          <div className="macro-item">
            <div className="macro-value" style={{ color: 'var(--accent-primary)' }}>
              {logEntry?.activities?.reduce((sum, a) => 
                sum + a.exercises.reduce((exSum, ex) => exSum + ex.sets.length, 0), 0
              ) ?? '0'}
            </div>
            <div className="macro-label">Sets</div>
          </div>

          {/* Cardio Minutes */}
          <div className="macro-item">
            <div className="macro-value" style={{ color: 'var(--accent-secondary)' }}>
              {logEntry?.cardio?.reduce((sum, c) => sum + (c.exercise.duration_minutes || 0), 0) ?? '0'}
            </div>
            <div className="macro-label">Cardio (min)</div>
          </div>

          {/* Supplements */}
          <div className="macro-item">
            <div className="macro-value" style={{ color: 'var(--text-secondary)' }}>
              {logEntry?.supplements?.length ?? '0'}
            </div>
            <div className="macro-label">Supplements</div>
          </div>
        </div>

        {logEntry?.notes && (
          <div className="notes-content" style={{ marginTop: '1.5rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Notes:</strong> {logEntry.notes}
          </div>
        )}
      </div>
    </div>
  );
}

