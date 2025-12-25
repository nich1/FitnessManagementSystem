'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { LogEntrySupplement } from '../types';

interface SupplementsSectionProps {
  supplements?: LogEntrySupplement[];
  onAdd?: () => void;
  onDelete?: (index: number) => void;
  onServingsChange?: (index: number, servings: number) => void;
}

export default function SupplementsSection({ supplements, onAdd, onDelete, onServingsChange }: SupplementsSectionProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIndex]);

  const startEditing = (index: number, currentServings: number) => {
    setEditingIndex(index);
    setEditValue(currentServings.toString());
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const confirmEditing = (index: number) => {
    if (!onServingsChange) {
      cancelEditing();
      return;
    }
    
    const servings = parseFloat(editValue);
    if (!isNaN(servings) && servings > 0) {
      onServingsChange(index, servings);
    }
    cancelEditing();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      confirmEditing(index);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // Helper to get the current servings (considering edit state)
  const getEffectiveServings = (entry: LogEntrySupplement, idx: number): number => {
    if (editingIndex === idx && editValue) {
      const value = parseFloat(editValue);
      if (!isNaN(value) && value > 0) {
        return value;
      }
    }
    return entry.servings;
  };
  if (!supplements || supplements.length === 0) {
    return (
      <div className="section-card">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">💊</span>
            Supplements
          </div>
          {onAdd && (
            <button className="section-add-btn" onClick={onAdd} aria-label="Add supplement">
              +
            </button>
          )}
        </div>
        <div className="section-empty">
          <span className="section-empty-icon">💉</span>
          <span>No supplements recorded</span>
        </div>
      </div>
    );
  }

  return (
    <div className="section-card">
      <div className="section-header">
        <div className="section-title">
          <span className="section-icon">💊</span>
          Supplements
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="section-badge">{supplements.length} items</span>
          {onAdd && (
            <button className="section-add-btn" onClick={onAdd} aria-label="Add supplement">
              +
            </button>
          )}
        </div>
      </div>
      <div className="section-content">
        {supplements.map((entry, index) => {
          const effectiveServings = getEffectiveServings(entry, index);
          const isEditing = editingIndex === index;
          
          return (
            <div key={entry.supplement.id} className="meal-card">
              <div className="meal-header">
                <div>
                  <span className="meal-name">{entry.supplement.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    {entry.supplement.brand}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isEditing ? (
                    <span className="supplement-servings-edit">
                      <input
                        ref={inputRef}
                        type="number"
                        className="supplement-servings-input"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => confirmEditing(index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        min="0.1"
                        step="0.5"
                      />
                      <span className="supplement-servings-unit">× {entry.supplement.serving_name}</span>
                    </span>
                  ) : (
                    <span 
                      className={`supplement-servings-display ${onServingsChange ? 'editable' : ''}`}
                      onClick={() => onServingsChange && startEditing(index, entry.servings)}
                      title={onServingsChange ? 'Click to edit servings' : undefined}
                    >
                      ×{effectiveServings} {entry.supplement.serving_name}
                    </span>
                  )}
                  {onDelete && (
                    <button
                      className="btn-delete-small"
                      onClick={() => onDelete(index)}
                      aria-label={`Delete ${entry.supplement.name}`}
                      title="Remove supplement"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              <div className="meal-foods">
                {entry.supplement.compounds.map((sc, idx) => (
                  <div key={idx} className="food-item">
                    <span className="food-name">{sc.compound.name}</span>
                    <span className="food-servings">
                      {sc.amount * effectiveServings} {sc.compound.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

