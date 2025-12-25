'use client';

import { useState } from 'react';
import type { CardioType, CardioExercise } from '../../types';

interface CardioFormProps {
  date: Date;
  onSubmit: (data: CardioFormData) => void;
  onCancel: () => void;
}

export interface CardioFormData {
  name: string;
  time: string;
  exercise: CardioExercise;
}

const cardioTypes: { value: CardioType; label: string }[] = [
  { value: 'walking', label: 'Walking' },
  { value: 'running', label: 'Running' },
  { value: 'incline_walking', label: 'Incline Walking' },
  { value: 'sprints', label: 'Sprints' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'other', label: 'Other' },
];

export default function CardioForm({ date, onSubmit, onCancel }: CardioFormProps) {
  const [name, setName] = useState('');
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [cardioType, setCardioType] = useState<CardioType>('walking');
  const [duration, setDuration] = useState(30);
  
  // Type-specific fields
  const [speed, setSpeed] = useState(3.0);
  const [incline, setIncline] = useState(10);
  const [numSprints, setNumSprints] = useState(10);
  const [sprintDuration, setSprintDuration] = useState(30);
  const [restDuration, setRestDuration] = useState(60);
  const [distance, setDistance] = useState(0);
  const [pace, setPace] = useState('');
  const [resistance, setResistance] = useState(5);
  const [laps, setLaps] = useState(0);
  const [stroke, setStroke] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dateStr = date.toISOString().split('T')[0];
    const timestamp = `${dateStr}T${time}:00`;
    
    let exercise: CardioExercise;
    
    switch (cardioType) {
      case 'incline_walking':
        exercise = { type: 'incline_walking', duration_minutes: duration, speed, incline };
        break;
      case 'sprints':
        exercise = { 
          type: 'sprints', 
          duration_minutes: duration, 
          num_sprints: numSprints,
          sprint_duration_seconds: sprintDuration,
          rest_duration_seconds: restDuration,
        };
        break;
      case 'running':
        exercise = { 
          type: 'running', 
          duration_minutes: duration,
          distance: distance || undefined,
          pace: pace || undefined,
        };
        break;
      case 'cycling':
        exercise = { 
          type: 'cycling', 
          duration_minutes: duration,
          distance: distance || undefined,
          resistance: resistance || undefined,
        };
        break;
      case 'swimming':
        exercise = { 
          type: 'swimming', 
          duration_minutes: duration,
          laps: laps || undefined,
          stroke: stroke || undefined,
        };
        break;
      case 'other':
        exercise = { type: 'other', duration_minutes: duration, description };
        break;
      default:
        exercise = { type: 'walking', duration_minutes: duration };
    }
    
    onSubmit({
      name: name || cardioTypes.find(t => t.value === cardioType)?.label || 'Cardio',
      time: timestamp,
      exercise,
    });
  };

  const renderTypeSpecificFields = () => {
    switch (cardioType) {
      case 'incline_walking':
        return (
          <>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Speed (mph)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value) || 0)}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Incline (%)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={incline}
                  onChange={(e) => setIncline(parseFloat(e.target.value) || 0)}
                  className="form-input"
                />
              </div>
            </div>
          </>
        );
      case 'sprints':
        return (
          <>
            <div className="form-group">
              <label className="form-label"># of Sprints</label>
              <input
                type="number"
                min="1"
                value={numSprints}
                onChange={(e) => setNumSprints(parseInt(e.target.value) || 0)}
                className="form-input"
              />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Sprint (sec)</label>
                <input
                  type="number"
                  min="1"
                  value={sprintDuration}
                  onChange={(e) => setSprintDuration(parseInt(e.target.value) || 0)}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Rest (sec)</label>
                <input
                  type="number"
                  min="1"
                  value={restDuration}
                  onChange={(e) => setRestDuration(parseInt(e.target.value) || 0)}
                  className="form-input"
                />
              </div>
            </div>
          </>
        );
      case 'running':
        return (
          <>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Distance (mi)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={distance}
                  onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Pace (e.g. 8:30)</label>
                <input
                  type="text"
                  value={pace}
                  onChange={(e) => setPace(e.target.value)}
                  className="form-input"
                  placeholder="min/mi"
                />
              </div>
            </div>
          </>
        );
      case 'cycling':
        return (
          <>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Distance (mi)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={distance}
                  onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Resistance</label>
                <input
                  type="number"
                  min="0"
                  value={resistance}
                  onChange={(e) => setResistance(parseInt(e.target.value) || 0)}
                  className="form-input"
                />
              </div>
            </div>
          </>
        );
      case 'swimming':
        return (
          <>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Laps</label>
                <input
                  type="number"
                  min="0"
                  value={laps}
                  onChange={(e) => setLaps(parseInt(e.target.value) || 0)}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Stroke</label>
                <input
                  type="text"
                  value={stroke}
                  onChange={(e) => setStroke(e.target.value)}
                  className="form-input"
                  placeholder="e.g. freestyle"
                />
              </div>
            </div>
          </>
        );
      case 'other':
        return (
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
              placeholder="Describe the cardio activity"
              rows={2}
              required
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <label className="form-label">Name (optional)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="form-input"
          placeholder="e.g., Morning Run, HIIT Session"
        />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="form-label">Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-field">
          <label className="form-label">Duration (min)</label>
          <input
            type="number"
            min="1"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
            className="form-input"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Type</label>
        <select
          value={cardioType}
          onChange={(e) => setCardioType(e.target.value as CardioType)}
          className="form-select"
        >
          {cardioTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {renderTypeSpecificFields()}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save Cardio
        </button>
      </div>
    </form>
  );
}

