'use client';

import { useState, useEffect } from 'react';
import type { LogEntryCarbCycle, CarbCycle, CarbCycleDayType } from '../types';
import { carbCycleApi } from '../api';

interface CyclesSectionProps {
  carbCycle?: LogEntryCarbCycle;
  onCarbCycleChange: (dayId: number | null) => void;
}

const DAY_TYPE_COLORS: Record<CarbCycleDayType, string> = {
  lowest: '#3b82f6',
  low: '#06b6d4',
  medium: '#10b981',
  high: '#f59e0b',
  highest: '#ef4444',
};

export default function CyclesSection({ carbCycle, onCarbCycleChange }: CyclesSectionProps) {
  const [carbCycles, setCarbCycles] = useState<CarbCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);

  useEffect(() => {
    loadCarbCycles();
  }, []);

  useEffect(() => {
    if (carbCycle) {
      setSelectedCycleId(carbCycle.carb_cycle.id);
      setSelectedDayId(carbCycle.selected_day.id);
    } else {
      setSelectedCycleId(null);
      setSelectedDayId(null);
    }
  }, [carbCycle]);

  const loadCarbCycles = async () => {
    try {
      const data = await carbCycleApi.getAll();
      setCarbCycles(data);
    } catch (error) {
      console.error('Failed to load carb cycles:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCycle = carbCycles.find(c => c.id === selectedCycleId);

  const handleCycleChange = (cycleId: number | null) => {
    setSelectedCycleId(cycleId);
    setSelectedDayId(null);
  };

  const handleDayChange = (dayId: number | null) => {
    setSelectedDayId(dayId);
  };

  const handleSave = () => {
    onCarbCycleChange(selectedDayId);
    setIsEditing(false);
  };

  const handleClear = () => {
    setSelectedCycleId(null);
    setSelectedDayId(null);
    onCarbCycleChange(null);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset to current value
    if (carbCycle) {
      setSelectedCycleId(carbCycle.carb_cycle.id);
      setSelectedDayId(carbCycle.selected_day.id);
    } else {
      setSelectedCycleId(null);
      setSelectedDayId(null);
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="section-card">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🔁</span>
            Cycles
          </div>
        </div>
        <div className="section-empty">
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Show empty state if no carb cycles exist
  if (carbCycles.length === 0) {
    return (
      <div className="section-card">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🔁</span>
            Cycles
          </div>
        </div>
        <div className="section-empty">
          <span className="section-empty-icon">🍞</span>
          <span>No carb cycles created yet</span>
        </div>
      </div>
    );
  }

  // Editing mode
  if (isEditing) {
    return (
      <div className="section-card">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🔁</span>
            Cycles
          </div>
        </div>
        <div className="section-content">
          <div className="cycles-edit-form">
            <div className="form-group">
              <label className="form-label">Carb Cycle</label>
              <select
                className="form-select"
                value={selectedCycleId || ''}
                onChange={(e) => handleCycleChange(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Select a carb cycle...</option>
                {carbCycles.map(cycle => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCycle && (
              <div className="form-group">
                <label className="form-label">Day</label>
                <div className="cycle-days-select">
                  {selectedCycle.days.map((day, index) => (
                    <button
                      key={day.id}
                      type="button"
                      className={`cycle-day-option ${selectedDayId === day.id ? 'selected' : ''}`}
                      onClick={() => handleDayChange(day.id)}
                      style={{ 
                        borderColor: selectedDayId === day.id ? DAY_TYPE_COLORS[day.day_type] : undefined,
                        background: selectedDayId === day.id ? `${DAY_TYPE_COLORS[day.day_type]}20` : undefined,
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
              </div>
            )}

            <div className="form-actions">
              {carbCycle && (
                <button type="button" className="btn btn-danger" onClick={handleClear}>
                  Clear
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleSave}
                disabled={!selectedDayId}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Display mode - no carb cycle selected
  if (!carbCycle) {
    return (
      <div className="section-card">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🔁</span>
            Cycles
          </div>
          <button className="section-add-btn" onClick={() => setIsEditing(true)} aria-label="Add carb cycle">
            +
          </button>
        </div>
        <div className="section-empty">
          <span className="section-empty-icon">🍞</span>
          <span>No carb cycle selected</span>
        </div>
      </div>
    );
  }

  // Display mode - carb cycle selected
  const dayIndex = carbCycle.carb_cycle.days.findIndex(d => d.id === carbCycle.selected_day.id);
  
  return (
    <div className="section-card">
      <div className="section-header">
        <div className="section-title">
          <span className="section-icon">🔁</span>
          Cycles
        </div>
        <button className="section-add-btn" onClick={() => setIsEditing(true)} aria-label="Edit carb cycle">
          ✎
        </button>
      </div>
      <div className="section-content">
        <div className="carb-cycle-display">
          <div className="cycle-name-row">
            <span className="cycle-label">🍞 Carb Cycle:</span>
            <span className="cycle-value">{carbCycle.carb_cycle.name}</span>
          </div>
          <div className="cycle-day-display">
            <div className="selected-day-card" style={{ borderColor: DAY_TYPE_COLORS[carbCycle.selected_day.day_type] }}>
              <span className="day-number">Day {dayIndex + 1}</span>
              <span 
                className="day-type-badge"
                style={{ backgroundColor: DAY_TYPE_COLORS[carbCycle.selected_day.day_type] }}
              >
                {carbCycle.selected_day.day_type}
              </span>
              <span className="day-carbs-large">{carbCycle.selected_day.carbs}g carbs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

