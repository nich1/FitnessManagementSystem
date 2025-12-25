'use client';

import { useState, useEffect } from 'react';
import type { Food } from '../../types';
import { foodApi } from '../../api';
import { useConfirmDialog } from '../ConfirmDialog';

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

export default function FoodsManager() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [formData, setFormData] = useState<NewFoodData>(initialNewFood);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [pendingFoodData, setPendingFoodData] = useState<any>(null);
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    try {
      const data = await foodApi.getAll();
      setFoods(data);
    } catch (error) {
      console.error('Failed to load foods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFood(null);
    setFormData(initialNewFood);
    setShowForm(true);
  };

  const handleEdit = (food: Food) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      serving_name: food.serving_name,
      serving_size: String(food.serving_size),
      calories: String(food.calories),
      protein_grams: String(food.protein.grams),
      protein_complete: food.protein.complete_amino_acid_profile,
      carbs_grams: String(food.carbs.grams),
      carbs_fiber: String(food.carbs.fiber || ''),
      carbs_sugar: String(food.carbs.sugar || ''),
      carbs_added_sugars: String(food.carbs.added_sugars || ''),
      fat_grams: String(food.fat.grams),
      fat_saturated: String(food.fat.saturated || ''),
      fat_monounsaturated: String(food.fat.monounsaturated || ''),
      fat_polyunsaturated: String(food.fat.polyunsaturated || ''),
      fat_trans: String(food.fat.trans || ''),
      fat_cholesterol: String(food.fat.cholesterol || ''),
    });
    setShowForm(true);
  };

  const handleDelete = async (food: Food) => {
    const confirmed = await confirm({
      title: 'Delete Food',
      message: `Are you sure you want to delete "${food.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      await foodApi.delete(food.id);
      setFoods(foods.filter(f => f.id !== food.id));
    } catch (error) {
      console.error('Failed to delete food:', error);
    }
  };

  const buildFoodData = () => ({
    name: formData.name,
    serving_name: formData.serving_name,
    serving_size: toNum(formData.serving_size),
    calories: toNum(formData.calories),
    protein: {
      grams: toNum(formData.protein_grams),
      complete_amino_acid_profile: formData.protein_complete,
    },
    carbs: {
      grams: toNum(formData.carbs_grams),
      fiber: toNum(formData.carbs_fiber) || undefined,
      sugar: toNum(formData.carbs_sugar) || undefined,
      added_sugars: toNum(formData.carbs_added_sugars) || undefined,
    },
    fat: {
      grams: toNum(formData.fat_grams),
      saturated: toNum(formData.fat_saturated) || undefined,
      monounsaturated: toNum(formData.fat_monounsaturated) || undefined,
      polyunsaturated: toNum(formData.fat_polyunsaturated) || undefined,
      trans: toNum(formData.fat_trans) || undefined,
      cholesterol: toNum(formData.fat_cholesterol) || undefined,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const foodData = buildFoodData();

    if (editingFood) {
      // Show the prompt asking if they want to update existing entries
      setPendingFoodData(foodData);
      setShowUpdatePrompt(true);
    } else {
      // Creating new food - just save it
      await saveNewFood(foodData);
    }
  };

  const saveNewFood = async (foodData: any) => {
    setSaving(true);
    try {
      const created = await foodApi.create(foodData);
      setFoods([...foods, created]);
      setShowForm(false);
      setFormData(initialNewFood);
      setEditingFood(null);
    } catch (error) {
      console.error('Failed to save food:', error);
      alert('Failed to save food');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateExisting = async () => {
    // User wants to update the existing food (affects previous days)
    if (!editingFood || !pendingFoodData) return;

    setSaving(true);
    try {
      const updated = await foodApi.update(editingFood.id, pendingFoodData);
      setFoods(foods.map(f => f.id === editingFood.id ? updated : f));
      setShowForm(false);
      setShowUpdatePrompt(false);
      setFormData(initialNewFood);
      setEditingFood(null);
      setPendingFoodData(null);
    } catch (error) {
      console.error('Failed to update food:', error);
      alert('Failed to update food');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNew = async () => {
    // User wants to create a new food with the updated values
    if (!pendingFoodData) return;

    setShowUpdatePrompt(false);
    await saveNewFood(pendingFoodData);
    setPendingFoodData(null);
  };

  const handleCancelPrompt = () => {
    setShowUpdatePrompt(false);
    setPendingFoodData(null);
  };

  const filteredFoods = foods.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="manager-loading">Loading foods...</div>;
  }

  return (
    <div className="manager">
      <div className="manager-header">
        <h2 className="manager-title">Foods</h2>
        <div className="manager-actions">
          <input
            type="text"
            placeholder="Search foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="manager-search"
          />
          <button className="btn btn-primary" onClick={handleCreate}>
            + New Food
          </button>
        </div>
      </div>

      {/* Update Prompt Modal */}
      {showUpdatePrompt && (
        <div className="modal-overlay">
          <div className="update-prompt-modal">
            <h3>Update Existing Food?</h3>
            <p>
              This food may be used in meals from previous days. How would you like to proceed?
            </p>
            <div className="update-prompt-options">
              <button
                className="btn btn-primary"
                onClick={handleUpdateExisting}
                disabled={saving}
              >
                {saving ? 'Updating...' : 'Update Existing'}
                <span className="btn-hint">Changes will apply to all previous days using this food</span>
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleCreateNew}
                disabled={saving}
              >
                {saving ? 'Creating...' : 'Create New Food'}
                <span className="btn-hint">Creates a new food, keeping the old one unchanged</span>
              </button>
            </div>
            <button className="btn btn-text" onClick={handleCancelPrompt}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {showForm && !showUpdatePrompt && (
        <div className="manager-form-overlay">
          <div className="manager-form-container">
            <div className="manager-form-header">
              <h3>{editingFood ? 'Edit Food' : 'New Food'}</h3>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="manager-form">
              <div className="form-section">
                <h4 className="form-section-title">Basic Info</h4>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                    placeholder="e.g., Chicken Breast"
                    required
                  />
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <input
                      type="text"
                      value={formData.serving_name}
                      onChange={(e) => setFormData({ ...formData, serving_name: e.target.value })}
                      className="form-input"
                      placeholder="e.g., grams"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Per Serving</label>
                    <input
                      type="number"
                      value={formData.serving_size}
                      onChange={(e) => setFormData({ ...formData, serving_size: e.target.value })}
                      className="form-input"
                      placeholder="100"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Calories</label>
                  <input
                    type="number"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                    className="form-input"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-section">
                <h4 className="form-section-title protein-title">Protein</h4>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Grams</label>
                    <input
                      type="number"
                      value={formData.protein_grams}
                      onChange={(e) => setFormData({ ...formData, protein_grams: e.target.value })}
                      className="form-input"
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Complete Amino</label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.protein_complete}
                        onChange={(e) => setFormData({ ...formData, protein_complete: e.target.checked })}
                      />
                      <span>Yes</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4 className="form-section-title carbs-title">Carbohydrates</h4>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Total Grams</label>
                    <input
                      type="number"
                      value={formData.carbs_grams}
                      onChange={(e) => setFormData({ ...formData, carbs_grams: e.target.value })}
                      className="form-input"
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fiber</label>
                    <input
                      type="number"
                      value={formData.carbs_fiber}
                      onChange={(e) => setFormData({ ...formData, carbs_fiber: e.target.value })}
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
                      value={formData.carbs_sugar}
                      onChange={(e) => setFormData({ ...formData, carbs_sugar: e.target.value })}
                      className="form-input"
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Added Sugars</label>
                    <input
                      type="number"
                      value={formData.carbs_added_sugars}
                      onChange={(e) => setFormData({ ...formData, carbs_added_sugars: e.target.value })}
                      className="form-input"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4 className="form-section-title fat-title">Fat</h4>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Total Grams</label>
                    <input
                      type="number"
                      value={formData.fat_grams}
                      onChange={(e) => setFormData({ ...formData, fat_grams: e.target.value })}
                      className="form-input"
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Saturated</label>
                    <input
                      type="number"
                      value={formData.fat_saturated}
                      onChange={(e) => setFormData({ ...formData, fat_saturated: e.target.value })}
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
                      value={formData.fat_monounsaturated}
                      onChange={(e) => setFormData({ ...formData, fat_monounsaturated: e.target.value })}
                      className="form-input"
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Polyunsaturated</label>
                    <input
                      type="number"
                      value={formData.fat_polyunsaturated}
                      onChange={(e) => setFormData({ ...formData, fat_polyunsaturated: e.target.value })}
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
                      value={formData.fat_trans}
                      onChange={(e) => setFormData({ ...formData, fat_trans: e.target.value })}
                      className="form-input"
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cholesterol (mg)</label>
                    <input
                      type="number"
                      value={formData.fat_cholesterol}
                      onChange={(e) => setFormData({ ...formData, fat_cholesterol: e.target.value })}
                      className="form-input"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingFood ? 'Update Food' : 'Create Food'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="manager-list">
        {filteredFoods.length === 0 ? (
          <div className="manager-empty">
            {searchQuery ? 'No foods match your search.' : 'No foods yet. Create your first food!'}
          </div>
        ) : (
          <table className="manager-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Serving</th>
                <th>Calories</th>
                <th>Protein</th>
                <th>Carbs</th>
                <th>Fat</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFoods.map((food) => (
                <tr key={food.id}>
                  <td className="food-name">{food.name}</td>
                  <td>{food.serving_size} {food.serving_name}</td>
                  <td>{food.calories}</td>
                  <td className="macro protein">{food.protein.grams}g</td>
                  <td className="macro carbs">{food.carbs.grams}g</td>
                  <td className="macro fat">{food.fat.grams}g</td>
                  <td className="actions">
                    <button className="btn-icon" onClick={() => handleEdit(food)} title="Edit">
                      ✏️
                    </button>
                    <button className="btn-icon danger" onClick={() => handleDelete(food)} title="Delete">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {ConfirmDialogComponent}
    </div>
  );
}
