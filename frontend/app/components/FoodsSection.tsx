'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { MealFood } from '../types';

interface FoodsSectionProps {
  foods?: MealFood[];
  onAdd?: () => void;
  onDelete?: (foodIndex: number) => void;
  onGramsChange?: (foodIndex: number, grams: number) => void;
  onCopyToToday?: () => void;
}

type EditMode = 'grams' | 'servings';

export default function FoodsSection({ foods, onAdd, onDelete, onGramsChange, onCopyToToday }: FoodsSectionProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editMode, setEditMode] = useState<EditMode>('grams');
  const [editValue, setEditValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  // Helper to get the current servings for a food item (considering edit state)
  const getEffectiveServings = (mf: MealFood, idx: number): number => {
    if (editingIndex === idx && editValue) {
      const value = parseFloat(editValue);
      if (!isNaN(value) && value > 0) {
        if (editMode === 'grams') {
          return value / mf.food.serving_size;
        } else {
          return value;
        }
      }
    }
    return mf.servings;
  };

  const calculateTotals = () => {
    if (!foods || foods.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    return foods.reduce(
      (totals, mf, idx) => {
        const servings = getEffectiveServings(mf, idx);
        totals.calories += mf.food.calories * servings;
        totals.protein += mf.food.protein.grams * servings;
        totals.carbs += mf.food.carbs.grams * servings;
        totals.fat += mf.food.fat.grams * servings;
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const handleDelete = (index: number) => {
    if (!onDelete) return;
    onDelete(index);
  };

  const startEditingGrams = (index: number, currentGrams: number) => {
    setEditingIndex(index);
    setEditMode('grams');
    setEditValue(currentGrams.toFixed(0));
  };

  const startEditingServings = (index: number, currentServings: number) => {
    setEditingIndex(index);
    setEditMode('servings');
    setEditValue(currentServings.toFixed(2));
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const confirmEditing = (index: number, servingSize: number) => {
    if (!onGramsChange) {
      cancelEditing();
      return;
    }
    
    const value = parseFloat(editValue);
    if (!isNaN(value) && value > 0) {
      if (editMode === 'grams') {
        onGramsChange(index, value);
      } else {
        // Convert servings to grams
        const grams = value * servingSize;
        onGramsChange(index, grams);
      }
    }
    cancelEditing();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number, servingSize: number) => {
    if (e.key === 'Enter') {
      confirmEditing(index, servingSize);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIndex]);

  if (!foods || foods.length === 0) {
    return (
      <div className="section-card">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🥗</span>
            Foods
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onAdd && (
              <button className="section-add-btn" onClick={onAdd} aria-label="Add food">
                +
              </button>
            )}
          </div>
        </div>
        <div className="section-empty">
          <span className="section-empty-icon">🍽️</span>
          <span>No foods recorded</span>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="section-card">
      <div className="section-header">
        <div className="section-title">
          <span className="section-icon">🥗</span>
          Foods
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="section-badge">{foods.length} items</span>
          {onCopyToToday && (
            <button className="section-copy-btn" onClick={onCopyToToday} aria-label="Copy foods to today" title="Copy to today">
              📋
            </button>
          )}
          {onAdd && (
            <button className="section-add-btn" onClick={onAdd} aria-label="Add food">
              +
            </button>
          )}
        </div>
      </div>
      <div className="section-content">
        <div className="macro-summary">
          <div className="macro-item calories">
            <div className="macro-value">{Math.round(totals.calories)}</div>
            <div className="macro-label">Calories</div>
          </div>
          <div className="macro-item protein">
            <div className="macro-value">{Math.round(totals.protein)}g</div>
            <div className="macro-label">Protein</div>
          </div>
          <div className="macro-item carbs">
            <div className="macro-value">{Math.round(totals.carbs)}g</div>
            <div className="macro-label">Carbs</div>
          </div>
          <div className="macro-item fat">
            <div className="macro-value">{Math.round(totals.fat)}g</div>
            <div className="macro-label">Fat</div>
          </div>
        </div>

        <div className="foods-list">
          {foods.map((mf, idx) => {
            const effectiveServings = getEffectiveServings(mf, idx);
            const calories = Math.round(mf.food.calories * effectiveServings);
            const protein = Math.round(mf.food.protein.grams * effectiveServings);
            const carbs = Math.round(mf.food.carbs.grams * effectiveServings);
            const fat = Math.round(mf.food.fat.grams * effectiveServings);
            const currentGrams = mf.servings * mf.food.serving_size;
            const isEditing = editingIndex === idx;
            
            return (
              <div key={idx} className="food-log-card">
                <div className="food-log-header">
                  <div className="food-log-title">
                    <span className="food-log-name">{mf.food.name}</span>
                    <span className="food-log-amount">
                      {isEditing && editMode === 'grams' ? (
                        <span className="grams-edit-container">
                          <input
                            ref={inputRef}
                            type="number"
                            className="grams-edit-input"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => confirmEditing(idx, mf.food.serving_size)}
                            onKeyDown={(e) => handleKeyDown(e, idx, mf.food.serving_size)}
                            min="0"
                            step="1"
                          />
                          <span className="grams-edit-unit">{mf.food.serving_name},</span>
                          <span className="servings-display">{(parseFloat(editValue) / mf.food.serving_size || 0).toFixed(2)} servings</span>
                        </span>
                      ) : isEditing && editMode === 'servings' ? (
                        <span className="grams-edit-container">
                          <span className="grams-display">{(parseFloat(editValue) * mf.food.serving_size || 0).toFixed(0)} {mf.food.serving_name},</span>
                          <input
                            ref={inputRef}
                            type="number"
                            className="servings-edit-input"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => confirmEditing(idx, mf.food.serving_size)}
                            onKeyDown={(e) => handleKeyDown(e, idx, mf.food.serving_size)}
                            min="0"
                            step="0.01"
                          />
                          <span className="servings-edit-unit">servings</span>
                        </span>
                      ) : (
                        <>
                          <span 
                            className={`grams-display ${onGramsChange ? 'editable' : ''}`}
                            onClick={() => onGramsChange && startEditingGrams(idx, currentGrams)}
                            title={onGramsChange ? 'Click to edit' : undefined}
                          >
                            {currentGrams.toFixed(0)} {mf.food.serving_name}
                          </span>
                          <span className="food-log-separator">,</span>
                          <span 
                            className={`servings-display ${onGramsChange ? 'editable' : ''}`}
                            onClick={() => onGramsChange && startEditingServings(idx, mf.servings)}
                            title={onGramsChange ? 'Click to edit' : undefined}
                          >
                            {mf.servings.toFixed(2)} servings
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                  {onDelete && (
                    <button
                      className="btn-delete-small"
                      onClick={() => handleDelete(idx)}
                      title="Remove from log"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="food-log-nutrients">
                  <div className="nutrient-pill calories">
                    <span className="nutrient-value">{calories}</span>
                    <span className="nutrient-label">cal</span>
                  </div>
                  <div className="nutrient-pill protein">
                    <span className="nutrient-value">{protein}g</span>
                    <span className="nutrient-label">protein</span>
                  </div>
                  <div className="nutrient-pill carbs">
                    <span className="nutrient-value">{carbs}g</span>
                    <span className="nutrient-label">carbs</span>
                  </div>
                  <div className="nutrient-pill fat">
                    <span className="nutrient-value">{fat}g</span>
                    <span className="nutrient-label">fat</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

