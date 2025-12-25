'use client';

import { useState } from 'react';

interface SleepFormProps {
  date: string;
  onSubmit: (data: SleepFormData) => void;
  onCancel: () => void;
}

export interface SleepFormData {
  date: string;
  duration: number;
  quality: number;
  notes?: string;
  naps: { duration: number }[];
}

export default function SleepForm({ date, onSubmit, onCancel }: SleepFormProps) {
  const [hours, setHours] = useState(7);
  const [minutes, setMinutes] = useState(0);
  const [quality, setQuality] = useState(7);
  const [notes, setNotes] = useState('');
  const [naps, setNaps] = useState<{ duration: number }[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalMinutes = hours * 60 + minutes;
    onSubmit({
      date,
      duration: totalMinutes,
      quality,
      notes: notes || undefined,
      naps,
    });
  };

  const addNap = () => {
    setNaps([...naps, { duration: 20 }]);
  };

  const updateNap = (index: number, duration: number) => {
    const newNaps = [...naps];
    newNaps[index] = { duration };
    setNaps(newNaps);
  };

  const removeNap = (index: number) => {
    setNaps(naps.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <label className="form-label">Sleep Duration</label>
        <div className="form-row">
          <div className="form-field">
            <input
              type="number"
              min="0"
              max="24"
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value) || 0)}
              className="form-input"
            />
            <span className="form-hint">hours</span>
          </div>
          <div className="form-field">
            <input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
              className="form-input"
            />
            <span className="form-hint">minutes</span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Quality (1-10)</label>
        <div className="quality-slider">
          <input
            type="range"
            min="1"
            max="10"
            value={quality}
            onChange={(e) => setQuality(parseInt(e.target.value))}
            className="form-range"
          />
          <span className="quality-value">{quality}</span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="form-textarea"
          placeholder="How did you sleep?"
          rows={3}
        />
      </div>

      <div className="form-group">
        <div className="form-label-row">
          <label className="form-label">Naps</label>
          <button type="button" className="btn-add-small" onClick={addNap}>
            + Add Nap
          </button>
        </div>
        {naps.map((nap, index) => (
          <div key={index} className="nap-item">
            <input
              type="number"
              min="1"
              value={nap.duration}
              onChange={(e) => updateNap(index, parseInt(e.target.value) || 0)}
              className="form-input"
            />
            <span className="form-hint">min</span>
            <button
              type="button"
              className="btn-remove-small"
              onClick={() => removeNap(index)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save Sleep
        </button>
      </div>
    </form>
  );
}

