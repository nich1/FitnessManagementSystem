'use client';

import { useState, useEffect } from 'react';
import type { Cup, HydrationUnit } from '../../types';
import { cupApi } from '../../api';
import { useConfirmDialog } from '../ConfirmDialog';

const UNITS: HydrationUnit[] = ['ml', 'oz', 'l'];

export default function CupsManager() {
  const [cups, setCups] = useState<Cup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCup, setEditingCup] = useState<Cup | null>(null);
  const [formData, setFormData] = useState({ name: '', amount: '', unit: 'ml' as HydrationUnit });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  useEffect(() => {
    loadCups();
  }, []);

  const loadCups = async () => {
    try {
      const data = await cupApi.getAll();
      setCups(data);
    } catch (error) {
      console.error('Failed to load cups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCup(null);
    setFormData({ name: '', amount: '', unit: 'ml' });
    setShowForm(true);
  };

  const handleEdit = (cup: Cup) => {
    setEditingCup(cup);
    setFormData({
      name: cup.name,
      amount: String(cup.amount),
      unit: cup.unit,
    });
    setShowForm(true);
  };

  const handleDelete = async (cup: Cup) => {
    const confirmed = await confirm({
      title: 'Delete Cup',
      message: `Are you sure you want to delete "${cup.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      await cupApi.delete(cup.id);
      setCups(cups.filter(c => c.id !== cup.id));
    } catch (error) {
      console.error('Failed to delete cup:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      const cupData = {
        name: formData.name,
        amount: parseFloat(formData.amount) || 0,
        unit: formData.unit,
      };

      if (editingCup) {
        await cupApi.delete(editingCup.id);
        const created = await cupApi.create(cupData);
        setCups(cups.map(c => c.id === editingCup.id ? created : c));
      } else {
        const created = await cupApi.create(cupData);
        setCups([...cups, created]);
      }

      setShowForm(false);
      setFormData({ name: '', amount: '', unit: 'ml' });
      setEditingCup(null);
      loadCups();
    } catch (error) {
      console.error('Failed to save cup:', error);
      alert('Failed to save cup');
    } finally {
      setSaving(false);
    }
  };

  const filteredCups = cups.filter(cup =>
    cup.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="manager-loading">Loading cups...</div>;
  }

  return (
    <div className="manager">
      <div className="manager-header">
        <h2 className="manager-title">Cups</h2>
        <div className="manager-actions">
          <input
            type="text"
            placeholder="Search cups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="manager-search"
          />
          <button className="btn btn-primary" onClick={handleCreate}>
            + New Cup
          </button>
        </div>
      </div>

      {showForm && (
        <div className="manager-form-overlay">
          <div className="manager-form-container small">
            <div className="manager-form-header">
              <h3>{editingCup ? 'Edit Cup' : 'New Cup'}</h3>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="manager-form">
              <div className="form-group">
                <label className="form-label">Cup Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Water Bottle, Coffee Mug"
                  required
                  autoFocus
                />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="form-input"
                    placeholder="500"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as HydrationUnit })}
                    className="form-select"
                  >
                    {UNITS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingCup ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="manager-list">
        {filteredCups.length === 0 ? (
          <div className="manager-empty">
            {searchQuery ? 'No cups match your search.' : 'No cups yet. Create your first cup!'}
          </div>
        ) : (
          <div className="simple-list">
            {filteredCups.map((cup) => (
              <div key={cup.id} className="simple-list-item">
                <div className="item-info">
                  <span className="item-name">{cup.name}</span>
                  <span className="item-detail">{cup.amount} {cup.unit}</span>
                </div>
                <div className="item-actions">
                  <button className="btn-icon" onClick={() => handleEdit(cup)} title="Edit">
                    ✏️
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDelete(cup)} title="Delete">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ConfirmDialogComponent}
    </div>
  );
}

