'use client';

import { useState, useEffect } from 'react';
import type { Meal, Food } from '../../types';
import { mealApi, foodApi } from '../../api';
import { useConfirmDialog } from '../ConfirmDialog';

interface MealFoodInput {
  food_id: number;
  amount: string;
}

export default function MealsManager() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [formData, setFormData] = useState({ name: '', foods: [] as MealFoodInput[] });
  const [saving, setSaving] = useState(false);
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [mealsData, foodsData] = await Promise.all([
        mealApi.getAll(),
        foodApi.getAll()
      ]);
      setMeals(mealsData);
      setFoods(foodsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFoodById = (id: number) => foods.find(f => f.id === id);

  const handleCreate = () => {
    setEditingMeal(null);
    setFormData({ name: '', foods: [] });
    setShowForm(true);
  };

  const handleEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setFormData({
      name: meal.name,
      foods: meal.foods.map(mf => ({
        food_id: mf.food.id,
        amount: String(mf.servings * mf.food.serving_size),
      })),
    });
    setShowForm(true);
  };

  const handleDelete = async (meal: Meal) => {
    const confirmed = await confirm({
      title: 'Delete Meal Template',
      message: `Are you sure you want to delete "${meal.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      await mealApi.delete(meal.id);
      setMeals(meals.filter(m => m.id !== meal.id));
    } catch (error) {
      console.error('Failed to delete meal:', error);
    }
  };

  const addFood = () => {
    if (foods.length === 0) return;
    const food = foods[0];
    setFormData({
      ...formData,
      foods: [...formData.foods, { food_id: food.id, amount: String(food.serving_size) }],
    });
  };

  const updateFoodItem = (index: number, field: 'food_id' | 'amount', value: string | number) => {
    const newFoods = [...formData.foods];
    if (field === 'food_id') {
      const food = getFoodById(Number(value));
      newFoods[index] = { food_id: Number(value), amount: String(food?.serving_size || 100) };
    } else {
      newFoods[index] = { ...newFoods[index], [field]: value };
    }
    setFormData({ ...formData, foods: newFoods });
  };

  const removeFood = (index: number) => {
    setFormData({
      ...formData,
      foods: formData.foods.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.foods.length === 0) return;

    setSaving(true);
    try {
      // Convert amounts to servings
      const mealData = {
        name: formData.name,
        foods: formData.foods.map(f => {
          const food = getFoodById(f.food_id);
          const servings = food ? parseFloat(f.amount) / food.serving_size : 0;
          return { food_id: f.food_id, servings };
        }),
      };

      if (editingMeal) {
        await mealApi.update(editingMeal.id, mealData);
      } else {
        await mealApi.create(mealData);
      }

      setShowForm(false);
      setFormData({ name: '', foods: [] });
      setEditingMeal(null);
      loadData();
    } catch (error) {
      console.error('Failed to save meal:', error);
      alert('Failed to save meal');
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (mealId: number) => {
    setExpandedMeal(expandedMeal === mealId ? null : mealId);
  };

  const calculateMealTotals = (meal: Meal) => {
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

  const calculateFormTotals = () => {
    return formData.foods.reduce(
      (totals, f) => {
        const food = getFoodById(f.food_id);
        if (food) {
          const servings = parseFloat(f.amount) / food.serving_size || 0;
          totals.calories += food.calories * servings;
          totals.protein += food.protein.grams * servings;
          totals.carbs += food.carbs.grams * servings;
          totals.fat += food.fat.grams * servings;
        }
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const filteredMeals = meals.filter(meal =>
    meal.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="manager-loading">Loading meals...</div>;
  }

  return (
    <div className="manager">
      <div className="manager-header">
        <h2 className="manager-title">Meals</h2>
        <div className="manager-actions">
          <input
            type="text"
            placeholder="Search meals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="manager-search"
          />
          <button className="btn btn-primary" onClick={handleCreate}>
            + New Meal
          </button>
        </div>
      </div>

      {showForm && (
        <div className="manager-form-overlay">
          <div className="manager-form-container">
            <div className="manager-form-header">
              <h3>{editingMeal ? 'Edit Meal' : 'New Meal'}</h3>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="manager-form">
              <div className="form-group">
                <label className="form-label">Meal Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Breakfast, Lunch, Dinner"
                  required
                />
              </div>

              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label">Foods *</label>
                  <button
                    type="button"
                    className="btn-add-small"
                    onClick={addFood}
                    disabled={foods.length === 0}
                  >
                    + Add Food
                  </button>
                </div>

                {foods.length === 0 && (
                  <p className="form-hint">Create foods first in the Foods manager.</p>
                )}

                {formData.foods.length === 0 && foods.length > 0 && (
                  <p className="form-empty">No foods added. Click "+ Add Food" to add foods to this meal.</p>
                )}

                {formData.foods.map((mf, index) => {
                  const food = getFoodById(mf.food_id);
                  const servings = food ? parseFloat(mf.amount) / food.serving_size || 0 : 0;
                  return (
                    <div key={index} className="meal-food-row">
                      <select
                        value={mf.food_id}
                        onChange={(e) => updateFoodItem(index, 'food_id', e.target.value)}
                        className="form-select"
                      >
                        {foods.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={mf.amount}
                        onChange={(e) => updateFoodItem(index, 'amount', e.target.value)}
                        className="form-input amount-input"
                        placeholder="Amount"
                      />
                      <span className="food-unit">{food?.serving_name || 'units'}</span>
                      <span className="food-servings">({servings.toFixed(1)} srv)</span>
                      <button
                        type="button"
                        className="btn-remove-small"
                        onClick={() => removeFood(index)}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}

                {formData.foods.length > 0 && (
                  <div className="meal-form-totals">
                    {(() => {
                      const totals = calculateFormTotals();
                      return (
                        <>
                          <span className="macro-pill calories">{Math.round(totals.calories)} cal</span>
                          <span className="macro-pill protein">{Math.round(totals.protein)}g P</span>
                          <span className="macro-pill carbs">{Math.round(totals.carbs)}g C</span>
                          <span className="macro-pill fat">{Math.round(totals.fat)}g F</span>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || !formData.name.trim() || formData.foods.length === 0}
                >
                  {saving ? 'Saving...' : editingMeal ? 'Update Meal' : 'Create Meal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="manager-list">
        {filteredMeals.length === 0 ? (
          <div className="manager-empty">
            {searchQuery ? 'No meals match your search.' : 'No meals yet. Create your first meal!'}
          </div>
        ) : (
          <div className="meals-cards">
            {filteredMeals.map((meal) => {
              const totals = calculateMealTotals(meal);
              const isExpanded = expandedMeal === meal.id;
              return (
                <div key={meal.id} className={`meal-card ${isExpanded ? 'expanded' : ''}`}>
                  <div className="meal-card-header" onClick={() => toggleExpand(meal.id)}>
                    <div className="meal-card-info">
                      <h3 className="meal-card-name">{meal.name}</h3>
                      <div className="meal-card-macros">
                        <span className="macro-pill calories">{Math.round(totals.calories)} cal</span>
                        <span className="macro-pill protein">{Math.round(totals.protein)}g P</span>
                        <span className="macro-pill carbs">{Math.round(totals.carbs)}g C</span>
                        <span className="macro-pill fat">{Math.round(totals.fat)}g F</span>
                      </div>
                    </div>
                    <div className="meal-card-actions">
                      <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                      <button
                        className="btn-icon"
                        onClick={(e) => { e.stopPropagation(); handleEdit(meal); }}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-icon danger" 
                        onClick={(e) => { e.stopPropagation(); handleDelete(meal); }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="meal-card-foods">
                      <table className="foods-table">
                        <thead>
                          <tr>
                            <th>Food</th>
                            <th>Amount</th>
                            <th>Calories</th>
                            <th>P</th>
                            <th>C</th>
                            <th>F</th>
                          </tr>
                        </thead>
                        <tbody>
                          {meal.foods.map((mf, idx) => (
                            <tr key={idx}>
                              <td>{mf.food.name}</td>
                              <td>{(mf.servings * mf.food.serving_size).toFixed(0)} {mf.food.serving_name}</td>
                              <td>{Math.round(mf.food.calories * mf.servings)}</td>
                              <td className="macro protein">{Math.round(mf.food.protein.grams * mf.servings)}g</td>
                              <td className="macro carbs">{Math.round(mf.food.carbs.grams * mf.servings)}g</td>
                              <td className="macro fat">{Math.round(mf.food.fat.grams * mf.servings)}g</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {ConfirmDialogComponent}
    </div>
  );
}
