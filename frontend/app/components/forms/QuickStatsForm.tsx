'use client';

import { useState, useEffect } from 'react';
import type { Phase, CarbCycle, CarbCycleDayType } from '../../types';
import { phaseApi, carbCycleApi } from '../../api';

const DAY_TYPE_COLORS: Record<CarbCycleDayType, string> = {
  lowest: '#3b82f6',
  low: '#06b6d4',
  medium: '#10b981',
  high: '#f59e0b',
  highest: '#ef4444',
};

interface QuickStatsFormProps {
  initialData?: {
    phase_id?: number;
    morning_weight?: number;
    num_standard_drinks?: number;
    notes?: string;
    carb_cycle_id?: number;
    carb_cycle_day_id?: number;
  };
  onSubmit: (data: QuickStatsFormData) => void;
  onCancel: () => void;
}

export interface QuickStatsFormData {
  phase?: { type: 'existing'; id: number } | { type: 'new'; name: string };
  morning_weight?: number;
  num_standard_drinks?: number;
  notes?: string;
  carb_cycle_day_id?: number | null;
  setDefaultPhase?: boolean;
}

// Helper functions for default phase storage
const DEFAULT_PHASE_KEY = 'defaultPhaseId';

export function getDefaultPhaseId(): number | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(DEFAULT_PHASE_KEY);
  return stored ? parseInt(stored, 10) : null;
}

export function setDefaultPhaseId(phaseId: number | null): void {
  if (typeof window === 'undefined') return;
  if (phaseId === null) {
    localStorage.removeItem(DEFAULT_PHASE_KEY);
  } else {
    localStorage.setItem(DEFAULT_PHASE_KEY, phaseId.toString());
  }
}

export default function QuickStatsForm({ initialData, onSubmit, onCancel }: QuickStatsFormProps) {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [carbCycles, setCarbCycles] = useState<CarbCycle[]>([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(initialData?.phase_id || null);
  const [selectedCarbCycleId, setSelectedCarbCycleId] = useState<number | null>(initialData?.carb_cycle_id || null);
  const [selectedCarbDayId, setSelectedCarbDayId] = useState<number | null>(initialData?.carb_cycle_day_id || null);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [showNewPhase, setShowNewPhase] = useState(false);
  const [morningWeight, setMorningWeight] = useState(initialData?.morning_weight || 0);
  const [drinks, setDrinks] = useState(initialData?.num_standard_drinks || 0);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [loading, setLoading] = useState(true);
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [currentDefaultPhaseId, setCurrentDefaultPhaseId] = useState<number | null>(null);

  // Load current default phase on mount
  useEffect(() => {
    const defaultId = getDefaultPhaseId();
    setCurrentDefaultPhaseId(defaultId);
    // If there's a default and no initial phase, use the default
    if (defaultId && !initialData?.phase_id) {
      setSelectedPhaseId(defaultId);
    }
  }, [initialData?.phase_id]);

  useEffect(() => {
    Promise.all([phaseApi.getAll(), carbCycleApi.getAll()])
      .then(([phasesData, carbCyclesData]) => {
        setPhases(phasesData);
        setCarbCycles(carbCyclesData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selectedCarbCycle = carbCycles.find(c => c.id === selectedCarbCycleId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let phase: QuickStatsFormData['phase'];
    if (showNewPhase && newPhaseName.trim()) {
      phase = { type: 'new', name: newPhaseName.trim() };
    } else if (selectedPhaseId) {
      phase = { type: 'existing', id: selectedPhaseId };
    }
    
    onSubmit({
      phase,
      morning_weight: morningWeight || undefined,
      num_standard_drinks: drinks || undefined,
      notes: notes || undefined,
      carb_cycle_day_id: selectedCarbDayId,
      setDefaultPhase: setAsDefault && selectedPhaseId ? true : undefined,
    });
  };

  const handleCarbCycleChange = (cycleId: number | null) => {
    setSelectedCarbCycleId(cycleId);
    setSelectedCarbDayId(null);
  };

  const createPhase = async () => {
    if (!newPhaseName.trim()) return;
    try {
      const created = await phaseApi.create(newPhaseName.trim());
      setPhases([...phases, created]);
      setSelectedPhaseId(created.id);
      setShowNewPhase(false);
      setNewPhaseName('');
    } catch (error) {
      console.error('Failed to create phase:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <div className="form-label-row">
          <label className="form-label">Phase</label>
          <button
            type="button"
            className="btn-add-small"
            onClick={() => setShowNewPhase(!showNewPhase)}
          >
            {showNewPhase ? 'Cancel' : '+ New Phase'}
          </button>
        </div>

        {showNewPhase ? (
          <div className="new-phase-form">
            <input
              type="text"
              value={newPhaseName}
              onChange={(e) => setNewPhaseName(e.target.value)}
              className="form-input"
              placeholder="Phase name (e.g., Bulk, Cut)"
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={createPhase}
              disabled={!newPhaseName.trim()}
            >
              Create
            </button>
          </div>
        ) : loading ? (
          <div className="form-loading">Loading phases...</div>
        ) : (
          <>
            <select
              value={selectedPhaseId || ''}
              onChange={(e) => setSelectedPhaseId(e.target.value ? parseInt(e.target.value) : null)}
              className="form-select"
            >
              <option value="">No phase selected</option>
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                  {phase.id === currentDefaultPhaseId ? ' (default)' : ''}
                </option>
              ))}
            </select>
            {selectedPhaseId && (
              <label className="form-checkbox-label" style={{ marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={setAsDefault}
                  onChange={(e) => setSetAsDefault(e.target.checked)}
                  className="form-checkbox"
                />
                <span>Set as default phase for new days</span>
                {selectedPhaseId === currentDefaultPhaseId && !setAsDefault && (
                  <span className="default-badge">Current default</span>
                )}
              </label>
            )}
          </>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Morning Weight (lb)</label>
        <input
          type="number"
          min="0"
          step="any"
          value={morningWeight || ''}
          onChange={(e) => setMorningWeight(parseFloat(e.target.value) || 0)}
          className="form-input"
          placeholder="Enter weight"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Standard Drinks</label>
        <div className="servings-selector">
          <button
            type="button"
            className="btn-icon"
            onClick={() => setDrinks(Math.max(0, drinks - 1))}
          >
            −
          </button>
          <span className="servings-value">{drinks}</span>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setDrinks(drinks + 1)}
          >
            +
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="form-textarea"
          placeholder="Daily notes..."
          rows={3}
        />
      </div>

      {carbCycles.length > 0 && (
        <div className="form-group">
          <label className="form-label">Carb Cycle</label>
          <select
            className="form-select"
            value={selectedCarbCycleId || ''}
            onChange={(e) => handleCarbCycleChange(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">No carb cycle</option>
            {carbCycles.map(cycle => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.name}
              </option>
            ))}
          </select>

          {selectedCarbCycle && (
            <div className="cycle-days-select" style={{ marginTop: '0.75rem' }}>
              {selectedCarbCycle.days.map((day, index) => (
                <button
                  key={day.id}
                  type="button"
                  className={`cycle-day-option ${selectedCarbDayId === day.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCarbDayId(day.id)}
                  style={{ 
                    borderColor: selectedCarbDayId === day.id ? DAY_TYPE_COLORS[day.day_type] : undefined,
                    background: selectedCarbDayId === day.id ? `${DAY_TYPE_COLORS[day.day_type]}20` : undefined,
                  }}
                >
                  <span className="day-num">Day {index + 1}</span>
                  <span 
                    className="day-type-pill"
                    style={{ backgroundColor: DAY_TYPE_COLORS[day.day_type] }}
                  >
                    {day.day_type}
                  </span>
                  <span className="day-carbs">{day.carbs}g</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save
        </button>
      </div>
    </form>
  );
}

