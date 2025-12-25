'use client';

import { useState, useEffect } from 'react';
import type { 
  SupplementCycle, 
  SupplementCycleDayRequest,
  SupplementCycleDayItemRequest,
  Supplement,
  Compound,
} from '../../types';
import { supplementCycleApi, supplementApi, compoundApi } from '../../api';
import { useConfirmDialog } from '../ConfirmDialog';

interface FormItem {
  type: 'supplement' | 'compound' | '';
  supplement_id?: number;
  compound_id?: number;
  amount: number;
}

interface FormDay {
  items: FormItem[];
}

export default function SupplementCycleManager() {
  const [cycles, setCycles] = useState<SupplementCycle[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [compounds, setCompounds] = useState<Compound[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCycle, setEditingCycle] = useState<SupplementCycle | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    days: [{ items: [{ type: '' as const, supplement_id: undefined, compound_id: undefined, amount: 0 }] }] as FormDay[],
  });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCycle, setExpandedCycle] = useState<number | null>(null);
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cyclesData, supplementsData, compoundsData] = await Promise.all([
        supplementCycleApi.getAll(),
        supplementApi.getAll(),
        compoundApi.getAll(),
      ]);
      setCycles(cyclesData);
      setSupplements(supplementsData);
      setCompounds(compoundsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCycle(null);
    setFormData({
      name: '',
      description: '',
      days: [{ items: [{ type: '', supplement_id: undefined, compound_id: undefined, amount: 0 }] }],
    });
    setShowForm(true);
  };

  const handleEdit = (cycle: SupplementCycle) => {
    setEditingCycle(cycle);
    setFormData({
      name: cycle.name,
      description: cycle.description || '',
      days: cycle.days.map(d => ({
        items: d.items.map(item => ({
          type: item.supplement_id ? 'supplement' : item.compound_id ? 'compound' : '' as const,
          supplement_id: item.supplement_id,
          compound_id: item.compound_id,
          amount: item.amount,
        })),
      })),
    });
    setShowForm(true);
  };

  const handleDelete = async (cycle: SupplementCycle) => {
    const confirmed = await confirm({
      title: 'Delete Supplement Cycle',
      message: `Are you sure you want to delete "${cycle.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await supplementCycleApi.delete(cycle.id);
      setCycles(cycles.filter(c => c.id !== cycle.id));
    } catch (error) {
      console.error('Failed to delete supplement cycle:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.days.length === 0) return;

    // Validate that each day has at least one item with selection
    const validDays = formData.days.every(day => 
      day.items.length > 0 && day.items.every(item => 
        item.type !== '' && (item.supplement_id || item.compound_id) && item.amount > 0
      )
    );

    if (!validDays) {
      alert('Each day must have at least one supplement or compound with a type, selection, and amount');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        days: formData.days.map(day => ({
          items: day.items.map(item => ({
            supplement_id: item.supplement_id,
            compound_id: item.compound_id,
            amount: item.amount,
          })),
        })),
      };

      if (editingCycle) {
        const updated = await supplementCycleApi.update(editingCycle.id, payload);
        setCycles(cycles.map(c => c.id === editingCycle.id ? updated : c));
      } else {
        const created = await supplementCycleApi.create(payload);
        setCycles([...cycles, created]);
      }

      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save supplement cycle:', error);
      alert('Failed to save supplement cycle');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      days: [{ items: [{ type: '', supplement_id: undefined, compound_id: undefined, amount: 0 }] }],
    });
    setEditingCycle(null);
  };

  const addDay = () => {
    setFormData({
      ...formData,
      days: [...formData.days, { items: [{ type: '', supplement_id: undefined, compound_id: undefined, amount: 0 }] }],
    });
  };

  const removeDay = (dayIndex: number) => {
    if (formData.days.length <= 1) return;
    setFormData({
      ...formData,
      days: formData.days.filter((_, i) => i !== dayIndex),
    });
  };

  const addItem = (dayIndex: number) => {
    const newDays = [...formData.days];
    newDays[dayIndex].items.push({ type: '', supplement_id: undefined, compound_id: undefined, amount: 0 });
    setFormData({ ...formData, days: newDays });
  };

  const removeItem = (dayIndex: number, itemIndex: number) => {
    const newDays = [...formData.days];
    if (newDays[dayIndex].items.length <= 1) return;
    newDays[dayIndex].items = newDays[dayIndex].items.filter((_, i) => i !== itemIndex);
    setFormData({ ...formData, days: newDays });
  };

  const updateItemType = (dayIndex: number, itemIndex: number, type: 'supplement' | 'compound' | '') => {
    const newDays = [...formData.days];
    const item = newDays[dayIndex].items[itemIndex];
    item.type = type;
    item.supplement_id = undefined;
    item.compound_id = undefined;
    setFormData({ ...formData, days: newDays });
  };

  const updateItem = (
    dayIndex: number, 
    itemIndex: number, 
    field: 'supplement_id' | 'compound_id' | 'amount', 
    value: number | undefined
  ) => {
    const newDays = [...formData.days];
    const item = newDays[dayIndex].items[itemIndex];
    
    if (field === 'supplement_id') {
      item.supplement_id = value;
    } else if (field === 'compound_id') {
      item.compound_id = value;
    } else {
      item.amount = value || 0;
    }
    
    setFormData({ ...formData, days: newDays });
  };

  const getItemName = (item: { supplement_id?: number; compound_id?: number }) => {
    if (item.supplement_id) {
      const supp = supplements.find(s => s.id === item.supplement_id);
      return supp ? `${supp.brand} ${supp.name}` : 'Unknown Supplement';
    }
    if (item.compound_id) {
      const comp = compounds.find(c => c.id === item.compound_id);
      return comp ? comp.name : 'Unknown Compound';
    }
    return 'Not selected';
  };

  const getItemUnit = (item: { compound_id?: number }) => {
    if (item.compound_id) {
      const comp = compounds.find(c => c.id === item.compound_id);
      return comp?.unit || '';
    }
    return 'serving(s)';
  };

  const filteredCycles = cycles.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="manager-loading">Loading supplement cycles...</div>;
  }

  return (
    <div className="manager">
      <div className="manager-header">
        <h2 className="manager-title">💊 Supplement Cycles</h2>
        <div className="manager-actions">
          <input
            type="text"
            placeholder="Search cycles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="manager-search"
          />
          <button className="btn btn-primary" onClick={handleCreate}>
            + New Cycle
          </button>
        </div>
      </div>

      <p className="manager-hint">
        Create supplement cycling protocols. Each day can have multiple supplements or compounds with specific amounts.
      </p>

      {showForm && (
        <div className="manager-form-overlay">
          <div className="manager-form-container large">
            <div className="manager-form-header">
              <h3>{editingCycle ? 'Edit Supplement Cycle' : 'New Supplement Cycle'}</h3>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="manager-form">
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Cycle Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                    placeholder="e.g., Creatine Loading, Vitamin D Protocol"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-textarea"
                  placeholder="Optional description..."
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

                <div className="supplement-cycle-days">
                  {formData.days.map((day, dayIndex) => (
                    <div key={dayIndex} className="supplement-cycle-day">
                      <div className="day-header">
                        <span className="day-title">Day {dayIndex + 1}</span>
                        <div className="day-header-actions">
                          <button
                            type="button"
                            className="btn btn-small btn-secondary"
                            onClick={() => addItem(dayIndex)}
                          >
                            + Add Item
                          </button>
                          {formData.days.length > 1 && (
                            <button
                              type="button"
                              className="btn-icon danger"
                              onClick={() => removeDay(dayIndex)}
                              title="Remove day"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="day-items">
                        {day.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="day-item-row">
                            <select
                              className="form-select item-type-select"
                              value={item.type}
                              onChange={(e) => updateItemType(dayIndex, itemIndex, e.target.value as 'supplement' | 'compound' | '')}
                            >
                              <option value="">Type...</option>
                              <option value="supplement">Supplement</option>
                              <option value="compound">Compound</option>
                            </select>

                            {item.type === 'supplement' && (
                              <select
                                className="form-select item-select"
                                value={item.supplement_id || ''}
                                onChange={(e) => updateItem(dayIndex, itemIndex, 'supplement_id', e.target.value ? Number(e.target.value) : undefined)}
                              >
                                <option value="">Select supplement...</option>
                                {supplements.map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.brand} {s.name}
                                  </option>
                                ))}
                              </select>
                            )}

                            {item.type === 'compound' && (
                              <select
                                className="form-select item-select"
                                value={item.compound_id || ''}
                                onChange={(e) => updateItem(dayIndex, itemIndex, 'compound_id', e.target.value ? Number(e.target.value) : undefined)}
                              >
                                <option value="">Select compound...</option>
                                {compounds.map(c => (
                                  <option key={c.id} value={c.id}>
                                    {c.name} ({c.unit})
                                  </option>
                                ))}
                              </select>
                            )}

                            {item.type === '' && (
                              <div className="item-select-placeholder">
                                Select a type first
                              </div>
                            )}

                            <div className="amount-input-group">
                              <input
                                type="number"
                                value={item.amount || ''}
                                onChange={(e) => updateItem(dayIndex, itemIndex, 'amount', parseFloat(e.target.value) || 0)}
                                className="form-input amount-input"
                                placeholder="Amt"
                                min="0"
                                step="0.1"
                              />
                              <span className="amount-unit">
                                {item.type === 'compound' ? getItemUnit(item) : 'srv'}
                              </span>
                            </div>

                            {day.items.length > 1 && (
                              <button
                                type="button"
                                className="btn-icon danger"
                                onClick={() => removeItem(dayIndex, itemIndex)}
                                title="Remove item"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
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
            {searchQuery ? 'No cycles match your search.' : 'No supplement cycles yet. Create your first cycle!'}
          </div>
        ) : (
          <div className="supplement-cycle-cards">
            {filteredCycles.map((cycle) => (
              <div key={cycle.id} className="supplement-cycle-card">
                <div 
                  className="supplement-cycle-card-header"
                  onClick={() => setExpandedCycle(expandedCycle === cycle.id ? null : cycle.id)}
                >
                  <div className="cycle-info">
                    <h3 className="cycle-name">{cycle.name}</h3>
                    {cycle.description && (
                      <p className="cycle-description">{cycle.description}</p>
                    )}
                    <div className="cycle-summary">
                      <span className="days-count">{cycle.days.length} days</span>
                      <span className="items-count">
                        {cycle.days.reduce((sum, d) => sum + d.items.length, 0)} total items
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
                  <div className="supplement-cycle-card-body">
                    {cycle.days.map((day, dayIndex) => (
                      <div key={day.id} className="cycle-day-detail">
                        <div className="day-detail-header">Day {dayIndex + 1}</div>
                        <div className="day-detail-items">
                          {day.items.map((item) => (
                            <div key={item.id} className="day-detail-item">
                              <span className="item-icon">{item.supplement_id ? '💊' : '🧪'}</span>
                              <span className="item-name">{getItemName(item)}</span>
                              <span className="item-amount">
                                {item.amount} {getItemUnit(item)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
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

