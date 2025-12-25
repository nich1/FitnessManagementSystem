'use client';

import { useState, useEffect } from 'react';
import type { CarbCycle, CarbCycleDayType, CarbCycleDayRequest } from '../../types';
import { carbCycleApi } from '../../api';
import { useConfirmDialog } from '../ConfirmDialog';

const DAY_TYPES: { value: CarbCycleDayType; label: string; color: string }[] = [
  { value: 'lowest', label: 'Lowest', color: '#3b82f6' },
  { value: 'low', label: 'Low', color: '#06b6d4' },
  { value: 'medium', label: 'Medium', color: '#10b981' },
  { value: 'high', label: 'High', color: '#f59e0b' },
  { value: 'highest', label: 'Highest', color: '#ef4444' },
];

const getDayTypeColor = (type: CarbCycleDayType) => {
  return DAY_TYPES.find(d => d.value === type)?.color || '#64748b';
};

export default function CarbCycleManager() {
  const [carbCycles, setCarbCycles] = useState<CarbCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCycle, setEditingCycle] = useState<CarbCycle | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    days: [{ day_type: 'medium' as CarbCycleDayType, carbs: 150 }] as CarbCycleDayRequest[],
  });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCycle, setExpandedCycle] = useState<number | null>(null);
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  useEffect(() => {
    loadCarbCycles();
  }, []);

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

  const handleCreate = () => {
    setEditingCycle(null);
    setFormData({
      name: '',
      description: '',
      days: [{ day_type: 'medium', carbs: 150 }],
    });
    setShowForm(true);
  };

  const handleEdit = (cycle: CarbCycle) => {
    setEditingCycle(cycle);
    setFormData({
      name: cycle.name,
      description: cycle.description || '',
      days: cycle.days.map(d => ({ day_type: d.day_type, carbs: d.carbs })),
    });
    setShowForm(true);
  };

  const handleDelete = async (cycle: CarbCycle) => {
    const confirmed = await confirm({
      title: 'Delete Carb Cycle',
      message: `Are you sure you want to delete "${cycle.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await carbCycleApi.delete(cycle.id);
      setCarbCycles(carbCycles.filter(c => c.id !== cycle.id));
    } catch (error) {
      console.error('Failed to delete carb cycle:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.days.length === 0) return;

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        days: formData.days,
      };

      if (editingCycle) {
        const updated = await carbCycleApi.update(editingCycle.id, payload);
        setCarbCycles(carbCycles.map(c => c.id === editingCycle.id ? updated : c));
      } else {
        const created = await carbCycleApi.create(payload);
        setCarbCycles([...carbCycles, created]);
      }

      setShowForm(false);
      setFormData({ name: '', description: '', days: [{ day_type: 'medium', carbs: 150 }] });
      setEditingCycle(null);
    } catch (error) {
      console.error('Failed to save carb cycle:', error);
      alert('Failed to save carb cycle');
    } finally {
      setSaving(false);
    }
  };

  const addDay = () => {
    setFormData({
      ...formData,
      days: [...formData.days, { day_type: 'medium', carbs: 150 }],
    });
  };

  const removeDay = (index: number) => {
    if (formData.days.length <= 1) return;
    setFormData({
      ...formData,
      days: formData.days.filter((_, i) => i !== index),
    });
  };

  const updateDay = (index: number, field: keyof CarbCycleDayRequest, value: CarbCycleDayType | number) => {
    const newDays = [...formData.days];
    newDays[index] = { ...newDays[index], [field]: value };
    setFormData({ ...formData, days: newDays });
  };

  const filteredCycles = carbCycles.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="manager-loading">Loading carb cycles...</div>;
  }

  return (
    <div className="manager">
      <div className="manager-header">
        <h2 className="manager-title">🍞 Carb Cycles</h2>
        <div className="manager-actions">
          <input
            type="text"
            placeholder="Search carb cycles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="manager-search"
          />
          <button className="btn btn-primary" onClick={handleCreate}>
            + New Carb Cycle
          </button>
        </div>
      </div>

      <p className="manager-hint">
        Create carbohydrate cycling plans with different carb intake levels for each day of the cycle.
      </p>

      {showForm && (
        <div className="manager-form-overlay">
          <div className="manager-form-container">
            <div className="manager-form-header">
              <h3>{editingCycle ? 'Edit Carb Cycle' : 'New Carb Cycle'}</h3>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="manager-form">
              <div className="form-group">
                <label className="form-label">Cycle Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Weekly Carb Cycle, Competition Prep"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-textarea"
                  placeholder="Optional description for this carb cycle..."
                  rows={2}
                />
              </div>

              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label">Cycle Days</label>
                  <button type="button" className="btn btn-small btn-secondary" onClick={addDay}>
                    + Add Day
                  </button>
                </div>
                <div className="cycle-days-list">
                  {formData.days.map((day, index) => (
                    <div key={index} className="cycle-day-row">
                      <span className="day-number">Day {index + 1}</span>
                      <select
                        value={day.day_type}
                        onChange={(e) => updateDay(index, 'day_type', e.target.value as CarbCycleDayType)}
                        className="form-select"
                        style={{ borderColor: getDayTypeColor(day.day_type) }}
                      >
                        {DAY_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <div className="carbs-input-group">
                        <input
                          type="number"
                          value={day.carbs}
                          onChange={(e) => updateDay(index, 'carbs', parseFloat(e.target.value) || 0)}
                          className="form-input carbs-input"
                          min="0"
                          step="5"
                        />
                        <span className="carbs-unit">g</span>
                      </div>
                      {formData.days.length > 1 && (
                        <button
                          type="button"
                          className="btn-icon danger"
                          onClick={() => removeDay(index)}
                          title="Remove day"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingCycle ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="manager-list">
        {filteredCycles.length === 0 ? (
          <div className="manager-empty">
            {searchQuery ? 'No carb cycles match your search.' : 'No carb cycles yet. Create your first carb cycle!'}
          </div>
        ) : (
          <div className="carb-cycle-cards">
            {filteredCycles.map((cycle) => (
              <div key={cycle.id} className="carb-cycle-card">
                <div 
                  className="carb-cycle-card-header"
                  onClick={() => setExpandedCycle(expandedCycle === cycle.id ? null : cycle.id)}
                >
                  <div className="cycle-info">
                    <h3 className="cycle-name">{cycle.name}</h3>
                    {cycle.description && (
                      <p className="cycle-description">{cycle.description}</p>
                    )}
                    <div className="cycle-summary">
                      <span className="days-count">{cycle.days.length} days</span>
                      <span className="avg-carbs">
                        Avg: {Math.round(cycle.days.reduce((sum, d) => sum + d.carbs, 0) / cycle.days.length)}g
                      </span>
                    </div>
                  </div>
                  <div className="cycle-actions">
                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleEdit(cycle); }} title="Edit">
                      ✏️
                    </button>
                    <button className="btn-icon danger" onClick={(e) => { e.stopPropagation(); handleDelete(cycle); }} title="Delete">
                      🗑️
                    </button>
                    <span className="expand-icon">{expandedCycle === cycle.id ? '▲' : '▼'}</span>
                  </div>
                </div>
                
                {expandedCycle === cycle.id && (
                  <div className="carb-cycle-card-body">
                    <div className="cycle-days-grid">
                      {cycle.days.map((day, index) => (
                        <div 
                          key={day.id} 
                          className="cycle-day-card"
                          style={{ borderLeftColor: getDayTypeColor(day.day_type) }}
                        >
                          <div className="day-label">Day {index + 1}</div>
                          <div 
                            className="day-type-badge"
                            style={{ backgroundColor: getDayTypeColor(day.day_type) }}
                          >
                            {day.day_type}
                          </div>
                          <div className="day-carbs">{day.carbs}g</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {ConfirmDialogComponent}
    </div>
  );
}

