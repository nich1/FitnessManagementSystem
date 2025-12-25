'use client';

import { useState, useEffect } from 'react';
import type { Cup, HydrationUnit } from '../../types';
import { cupApi } from '../../api';

interface HydrationFormProps {
  date: Date;
  onSubmit: (data: HydrationFormData) => void;
  onCancel: () => void;
}

export interface HydrationFormData {
  timestamp: string;
  cup_id: number;
  servings: number;
}

interface CupFormData {
  name: string;
  amount: number;
  unit: HydrationUnit;
}

export default function HydrationForm({ date, onSubmit, onCancel }: HydrationFormProps) {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [cups, setCups] = useState<Cup[]>([]);
  const [selectedCupId, setSelectedCupId] = useState<number | null>(null);
  const [servings, setServings] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showNewCup, setShowNewCup] = useState(false);
  const [newCup, setNewCup] = useState<CupFormData>({ name: '', amount: 500, unit: 'ml' });

  useEffect(() => {
    cupApi.getAll()
      .then((data) => {
        setCups(data);
        if (data.length > 0) {
          setSelectedCupId(data[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCupId) return;
    
    const dateStr = date.toISOString().split('T')[0];
    const timestamp = `${dateStr}T${time}:00`;
    
    onSubmit({
      timestamp,
      cup_id: selectedCupId,
      servings,
    });
  };

  const createCup = async () => {
    if (!newCup.name.trim()) return;
    try {
      const response = await fetch('http://localhost:8000/cups/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCup),
      });
      const created = await response.json();
      setCups([...cups, created]);
      setSelectedCupId(created.id);
      setShowNewCup(false);
      setNewCup({ name: '', amount: 500, unit: 'ml' });
    } catch (error) {
      console.error('Failed to create cup:', error);
    }
  };

  const selectedCup = cups.find(c => c.id === selectedCupId);
  const totalAmount = selectedCup ? selectedCup.amount * servings : 0;

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
        <div className="form-label-row">
          <label className="form-label">Cup/Container</label>
          <button
            type="button"
            className="btn-add-small"
            onClick={() => setShowNewCup(!showNewCup)}
          >
            {showNewCup ? 'Cancel' : '+ New Cup'}
          </button>
        </div>

        {showNewCup && (
          <div className="new-cup-form">
            <input
              type="text"
              value={newCup.name}
              onChange={(e) => setNewCup({ ...newCup, name: e.target.value })}
              className="form-input"
              placeholder="Cup name (e.g., Water Bottle)"
            />
            <div className="form-row">
              <input
                type="number"
                min="1"
                value={newCup.amount}
                onChange={(e) => setNewCup({ ...newCup, amount: parseInt(e.target.value) || 0 })}
                className="form-input"
              />
              <select
                value={newCup.unit}
                onChange={(e) => setNewCup({ ...newCup, unit: e.target.value as HydrationUnit })}
                className="form-select"
              >
                <option value="ml">ml</option>
                <option value="oz">oz</option>
                <option value="l">L</option>
              </select>
              <button
                type="button"
                className="btn btn-primary"
                onClick={createCup}
                disabled={!newCup.name.trim()}
              >
                Create
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="form-loading">Loading cups...</div>
        ) : cups.length === 0 ? (
          <div className="form-empty">No cups available. Create one above.</div>
        ) : (
          <select
            value={selectedCupId || ''}
            onChange={(e) => setSelectedCupId(parseInt(e.target.value))}
            className="form-select"
            required
          >
            {cups.map((cup) => (
              <option key={cup.id} value={cup.id}>
                {cup.name} ({cup.amount} {cup.unit})
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Servings (times filled)</label>
        <div className="servings-selector">
          <button
            type="button"
            className="btn-icon"
            onClick={() => setServings(Math.max(0.5, servings - 0.5))}
          >
            −
          </button>
          <span className="servings-value">{servings}</span>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setServings(servings + 0.5)}
          >
            +
          </button>
        </div>
        {selectedCup && (
          <div className="hydration-total">
            Total: <strong>{totalAmount} {selectedCup.unit}</strong>
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={!selectedCupId}>
          Save Hydration
        </button>
      </div>
    </form>
  );
}

