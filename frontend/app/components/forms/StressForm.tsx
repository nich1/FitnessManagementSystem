'use client';

import { useState } from 'react';
import type { StressLevel } from '../../types';

interface StressFormProps {
  date: Date;
  onSubmit: (data: StressFormData) => void;
  onCancel: () => void;
}

export interface StressFormData {
  timestamp: string;
  level: StressLevel;
  notes?: string;
}

const stressLevels: { value: StressLevel; label: string; emoji: string }[] = [
  { value: 'very_low', label: 'Very Low', emoji: '😌' },
  { value: 'low', label: 'Low', emoji: '🙂' },
  { value: 'medium', label: 'Medium', emoji: '😐' },
  { value: 'high', label: 'High', emoji: '😰' },
  { value: 'very_high', label: 'Very High', emoji: '😫' },
];

export default function StressForm({ date, onSubmit, onCancel }: StressFormProps) {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [level, setLevel] = useState<StressLevel>('medium');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dateStr = date.toISOString().split('T')[0];
    const timestamp = `${dateStr}T${time}:00`;
    
    onSubmit({
      timestamp,
      level,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <label className="form-label">Time</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="form-input"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Stress Level</label>
        <div className="stress-level-selector">
          {stressLevels.map((sl) => (
            <button
              key={sl.value}
              type="button"
              className={`stress-level-btn ${level === sl.value ? 'selected' : ''} ${sl.value}`}
              onClick={() => setLevel(sl.value)}
            >
              <span className="stress-emoji">{sl.emoji}</span>
              <span className="stress-label">{sl.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="form-textarea"
          placeholder="What's causing stress? How are you feeling?"
          rows={3}
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save Stress
        </button>
      </div>
    </form>
  );
}

