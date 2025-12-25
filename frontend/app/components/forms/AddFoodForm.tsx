'use client';

import { useState, useEffect } from 'react';
import type { Food, Meal, LogEntryFoodInput } from '../../types';
import { foodApi, mealApi } from '../../api';

interface AddFoodFormProps {
  onSubmit: (foods: LogEntryFoodInput[]) => void;
  onCancel: () => void;
}

// A selected item can be either a food or a meal (template)
type SelectedItemType = 'food' | 'meal';

interface SelectedItem {
  type: SelectedItemType;
  id: number;
  multiplier: string; // For foods: amount in units. For meals: multiplier (1 = full meal)
}

interface NewFoodData {
  name: string;
  serving_name: string;
  serving_size: string;
  calories: string;
  protein_grams: string;
  protein_complete: boolean;
  carbs_grams: string;
  carbs_fiber: string;
  carbs_sugar: string;
  carbs_added_sugars: string;
  fat_grams: string;
  fat_saturated: string;
  fat_monounsaturated: string;
  fat_polyunsaturated: string;
  fat_trans: string;
  fat_cholesterol: string;
}

const initialNewFood: NewFoodData = {
  name: '',
  serving_name: 'grams',
  serving_size: '100',
  calories: '',
  protein_grams: '',
  protein_complete: false,
  carbs_grams: '',
  carbs_fiber: '',
  carbs_sugar: '',
  carbs_added_sugars: '',
  fat_grams: '',
  fat_saturated: '',
  fat_monounsaturated: '',
  fat_polyunsaturated: '',
  fat_trans: '',
  fat_cholesterol: '',
};

const toNum = (val: string): number => {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
};

export default function AddFoodForm({ onSubmit, onCancel }: AddFoodFormProps) {
  const [availableFoods, setAvailableFoods] = useState<Food[]>([]);
  const [availableMeals, setAvailableMeals] = useState<Meal[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewFood, setShowNewFood] = useState(false);
  const [newFood, setNewFood] = useState<NewFoodData>(initialNewFood);
  const [creatingFood, setCreatingFood] = useState(false);

  useEffect(() => {
    Promise.all([foodApi.getAll(), mealApi.getAll()])
      .then(([foods, meals]) => {
        setAvailableFoods(foods);
        setAvailableMeals(meals);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getFoodById = (id: number) => availableFoods.find(f => f.id === id);
  const getMealById = (id: number) => availableMeals.find(m => m.id === id);

  // Calculate meal totals
  const getMealTotals = (meal: Meal) => {
    return meal.foods.reduce(
      (totals, mf) => {
        totals.calories += mf.food.calories * mf.servings;
        totals.protein += mf.food.protein.grams * mf.servings;
        totals.carbs += mf.food.carbs.grams * mf.servings;
        totals.fat += mf.food.fat.grams * mf.servings;
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  // Calculate macros for a selected item
  const calculateItemMacros = (item: SelectedItem) => {
    if (item.type === 'food') {
      const food = getFoodById(item.id);
      if (!food) return { calories: 0, protein: 0, carbs: 0, fat: 0, servings: 0 };
      const servings = food.serving_size > 0 ? toNum(item.multiplier) / food.serving_size : 0;
      return {
        calories: food.calories * servings,
        protein: food.protein.grams * servings,
        carbs: food.carbs.grams * servings,
        fat: food.fat.grams * servings,
        servings,
      };
    } else {
      const meal = getMealById(item.id);
      if (!meal) return { calories: 0, protein: 0, carbs: 0, fat: 0, servings: 0 };
      const mealTotals = getMealTotals(meal);
      const multiplier = toNum(item.multiplier);
      return {
        calories: mealTotals.calories * multiplier,
        protein: mealTotals.protein * multiplier,
        carbs: mealTotals.carbs * multiplier,
        fat: mealTotals.fat * multiplier,
        servings: multiplier,
      };
    }
  };

  const calculateTotals = () => {
    return selectedItems.reduce(
      (totals, item) => {
        const macros = calculateItemMacros(item);
        totals.calories += macros.calories;
        totals.protein += macros.protein;
        totals.carbs += macros.carbs;
        totals.fat += macros.fat;
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      alert('Please add at least one food');
      return;
    }

    // Convert all items to food_id + servings format
    const foods: LogEntryFoodInput[] = [];

    for (const item of selectedItems) {
      if (item.type === 'food') {
        const food = getFoodById(item.id);
        if (food) {
          const servings = food.serving_size > 0 ? toNum(item.multiplier) / food.serving_size : 0;
          foods.push({ food_id: item.id, servings });
        }
      } else {
        // Expand meal template to individual foods
        const meal = getMealById(item.id);
        if (meal && meal.foods && meal.foods.length > 0) {
          const multiplier = toNum(item.multiplier);
          for (const mf of meal.foods) {
            foods.push({ food_id: mf.food.id, servings: mf.servings * multiplier });
          }
        }
      }
    }

    if (foods.length === 0) {
      alert('Could not extract any foods from the selected items');
      return;
    }

    onSubmit(foods);
  };

  const addItem = () => {
    if (availableFoods.length > 0) {
      const food = availableFoods[0];
      setSelectedItems([...selectedItems, { type: 'food', id: food.id, multiplier: String(food.serving_size) }]);
    } else if (availableMeals.length > 0) {
      setSelectedItems([...selectedItems, { type: 'meal', id: availableMeals[0].id, multiplier: '1' }]);
    }
  };

  const updateItem = (index: number, type: SelectedItemType, id: number) => {
    const newItems = [...selectedItems];
    if (type === 'food') {
      const food = getFoodById(id);
      newItems[index] = { type: 'food', id, multiplier: String(food?.serving_size || 100) };
    } else {
      newItems[index] = { type: 'meal', id, multiplier: '1' };
    }
    setSelectedItems(newItems);
  };

  const updateMultiplier = (index: number, multiplier: string) => {
    const newItems = [...selectedItems];
    newItems[index] = { ...newItems[index], multiplier };
    setSelectedItems(newItems);
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const createFood = async () => {
    if (!newFood.name.trim()) return;
    setCreatingFood(true);
    try {
      const foodData = {
        name: newFood.name,
        serving_name: newFood.serving_name,
        serving_size: toNum(newFood.serving_size),
        calories: toNum(newFood.calories),
        protein: {
          grams: toNum(newFood.protein_grams),
          complete_amino_acid_profile: newFood.protein_complete,
        },
        carbs: {
          grams: toNum(newFood.carbs_grams),
          fiber: toNum(newFood.carbs_fiber) || undefined,
          sugar: toNum(newFood.carbs_sugar) || undefined,
          added_sugars: toNum(newFood.carbs_added_sugars) || undefined,
        },
        fat: {
          grams: toNum(newFood.fat_grams),
          saturated: toNum(newFood.fat_saturated) || undefined,
          monounsaturated: toNum(newFood.fat_monounsaturated) || undefined,
          polyunsaturated: toNum(newFood.fat_polyunsaturated) || undefined,
          trans: toNum(newFood.fat_trans) || undefined,
          cholesterol: toNum(newFood.fat_cholesterol) || undefined,
        },
      };
      const created = await foodApi.create(foodData as any);
      setAvailableFoods([...availableFoods, created]);
      setSelectedItems([...selectedItems, { type: 'food', id: created.id, multiplier: String(created.serving_size) }]);
      setShowNewFood(false);
      setNewFood(initialNewFood);
    } catch (error) {
      console.error('Failed to create food:', error);
    } finally {
      setCreatingFood(false);
    }
  };

  const parseDropdownValue = (value: string): { type: SelectedItemType; id: number } | null => {
    const [type, idStr] = value.split(':');
    if ((type === 'food' || type === 'meal') && idStr) {
      return { type, id: parseInt(idStr) };
    }
    return null;
  };

  const totals = calculateTotals();
  const hasItems = availableFoods.length > 0 || availableMeals.length > 0;

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <div className="form-label-row">
          <label className="form-label">Add Foods to Today's Log</label>
          <button
            type="button"
            className="btn-add-small"
            onClick={() => setShowNewFood(!showNewFood)}
          >
            {showNewFood ? 'Cancel' : '+ New Food'}
          </button>
        </div>

        {showNewFood && (
          <div className="new-food-form">
            <div className="food-form-section">
              <h4 className="food-form-section-title">Basic Info</h4>
              <div className="form-group">
                <label className="form-label">Food Name *</label>
                <input
                  type="text"
                  value={newFood.name}
                  onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Chicken Breast, Brown Rice"
                />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Unit *</label>
                  <input
                    type="text"
                    value={newFood.serving_name}
                    onChange={(e) => setNewFood({ ...newFood, serving_name: e.target.value })}
                    className="form-input"
                    placeholder="e.g., g, ml, oz"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Per Serving *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newFood.serving_size}
                    onChange={(e) => setNewFood({ ...newFood, serving_size: e.target.value })}
                    className="form-input"
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Calories (per serving) *</label>
                <input
                  type="number"
                  min="0"
                  value={newFood.calories}
                  onChange={(e) => setNewFood({ ...newFood, calories: e.target.value })}
                  className="form-input"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="food-form-section">
              <h4 className="food-form-section-title protein-title">Protein (per serving)</h4>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Grams *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newFood.protein_grams}
                    onChange={(e) => setNewFood({ ...newFood, protein_grams: e.target.value })}
                    className="form-input"
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Complete Amino Profile</label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newFood.protein_complete}
                      onChange={(e) => setNewFood({ ...newFood, protein_complete: e.target.checked })}
                    />
                    <span>Yes</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="food-form-section">
              <h4 className="food-form-section-title carbs-title">Carbohydrates (per serving)</h4>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Total Grams *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newFood.carbs_grams}
                    onChange={(e) => setNewFood({ ...newFood, carbs_grams: e.target.value })}
                    className="form-input"
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fiber</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newFood.carbs_fiber}
                    onChange={(e) => setNewFood({ ...newFood, carbs_fiber: e.target.value })}
                    className="form-input"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Sugar</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newFood.carbs_sugar}
                    onChange={(e) => setNewFood({ ...newFood, carbs_sugar: e.target.value })}
                    className="form-input"
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Added Sugars</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newFood.carbs_added_sugars}
                    onChange={(e) => setNewFood({ ...newFood, carbs_added_sugars: e.target.value })}
                    className="form-input"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="food-form-section">
              <h4 className="food-form-section-title fat-title">Fat (per serving)</h4>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Total Grams *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newFood.fat_grams}
                    onChange={(e) => setNewFood({ ...newFood, fat_grams: e.target.value })}
                    className="form-input"
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Saturated</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newFood.fat_saturated}
                    onChange={(e) => setNewFood({ ...newFood, fat_saturated: e.target.value })}
                    className="form-input"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Monounsaturated</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newFood.fat_monounsaturated}
                    onChange={(e) => setNewFood({ ...newFood, fat_monounsaturated: e.target.value })}
                    className="form-input"
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Polyunsaturated</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newFood.fat_polyunsaturated}
                    onChange={(e) => setNewFood({ ...newFood, fat_polyunsaturated: e.target.value })}
                    className="form-input"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Trans Fat</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newFood.fat_trans}
                    onChange={(e) => setNewFood({ ...newFood, fat_trans: e.target.value })}
                    className="form-input"
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cholesterol (mg)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newFood.fat_cholesterol}
                    onChange={(e) => setNewFood({ ...newFood, fat_cholesterol: e.target.value })}
                    className="form-input"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={createFood}
              disabled={!newFood.name.trim() || creatingFood}
              style={{ width: '100%' }}
            >
              {creatingFood ? 'Creating...' : 'Create & Add Food'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="form-loading">Loading foods...</div>
        ) : (
          <>
            {hasItems && (
              <button
                type="button"
                className="btn-add-small"
                onClick={addItem}
                style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}
              >
                + Add Food
              </button>
            )}

            {selectedItems.length === 0 && !hasItems && !showNewFood && (
              <div className="form-empty">No foods available. Create a new food above.</div>
            )}

            {selectedItems.map((item, index) => {
              const macros = calculateItemMacros(item);
              const isFood = item.type === 'food';
              const food = isFood ? getFoodById(item.id) : null;
              const meal = !isFood ? getMealById(item.id) : null;

              return (
                <div key={index} className="food-item-card">
                  <div className="food-item-header">
                    <select
                      value={`${item.type}:${item.id}`}
                      onChange={(e) => {
                        const parsed = parseDropdownValue(e.target.value);
                        if (parsed) {
                          updateItem(index, parsed.type, parsed.id);
                        }
                      }}
                      className="form-select"
                    >
                      {availableFoods.length > 0 && (
                        <optgroup label="Foods">
                          {availableFoods.map((f) => (
                            <option key={`food:${f.id}`} value={`food:${f.id}`}>
                              {f.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {availableMeals.length > 0 && (
                        <optgroup label="Meal Templates">
                          {availableMeals.map((m) => (
                            <option key={`meal:${m.id}`} value={`meal:${m.id}`}>
                              {m.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <button
                      type="button"
                      className="btn-remove-small"
                      onClick={() => removeItem(index)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="food-item-amount">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.multiplier}
                      onChange={(e) => updateMultiplier(index, e.target.value)}
                      className="form-input amount-input"
                    />
                    <span className="amount-unit">
                      {isFood ? (food?.serving_name || 'units') : '×'}
                    </span>
                  </div>
                  <div className="food-item-macros">
                    <span className="macro-badge servings">{macros.servings.toFixed(1)} srv</span>
                    <span className="macro-badge calories">{Math.round(macros.calories)} cal</span>
                    <span className="macro-badge protein">{Math.round(macros.protein)}g P</span>
                    <span className="macro-badge carbs">{Math.round(macros.carbs)}g C</span>
                    <span className="macro-badge fat">{Math.round(macros.fat)}g F</span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {selectedItems.length > 0 && (
        <div className="meal-totals">
          <div className="total-item">
            <span className="total-value calories">{Math.round(totals.calories)}</span>
            <span className="total-label">cal</span>
          </div>
          <div className="total-item">
            <span className="total-value protein">{Math.round(totals.protein)}g</span>
            <span className="total-label">protein</span>
          </div>
          <div className="total-item">
            <span className="total-value carbs">{Math.round(totals.carbs)}g</span>
            <span className="total-label">carbs</span>
          </div>
          <div className="total-item">
            <span className="total-value fat">{Math.round(totals.fat)}g</span>
            <span className="total-label">fat</span>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={selectedItems.length === 0}
        >
          Add to Log
        </button>
      </div>
    </form>
  );
}

