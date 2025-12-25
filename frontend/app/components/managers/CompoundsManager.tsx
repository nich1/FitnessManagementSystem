'use client';

import { useState, useEffect } from 'react';
import type { Compound, CompoundUnit } from '../../types';
import { compoundApi } from '../../api';
import { useConfirmDialog } from '../ConfirmDialog';

const UNITS: CompoundUnit[] = ['mg', 'g', 'mcg', 'iu'];

export default function CompoundsManager() {
  const [compounds, setCompounds] = useState<Compound[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompound, setEditingCompound] = useState<Compound | null>(null);
  const [formData, setFormData] = useState({ name: '', unit: 'mg' as CompoundUnit });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  useEffect(() => {
    loadCompounds();
  }, []);

  const loadCompounds = async () => {
    try {
      const data = await compoundApi.getAll();
      setCompounds(data);
    } catch (error) {
      console.error('Failed to load compounds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCompound(null);
    setFormData({ name: '', unit: 'mg' });
    setShowForm(true);
  };

  const handleEdit = (compound: Compound) => {
    setEditingCompound(compound);
    setFormData({
      name: compound.name,
      unit: compound.unit,
    });
    setShowForm(true);
  };

  const handleDelete = async (compound: Compound) => {
    const confirmed = await confirm({
      title: 'Delete Compound',
      message: `Are you sure you want to delete "${compound.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      await compoundApi.delete(compound.id);
      setCompounds(compounds.filter(c => c.id !== compound.id));
    } catch (error) {
      console.error('Failed to delete compound:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      if (editingCompound) {
        const updated = await compoundApi.update(editingCompound.id, formData);
        setCompounds(compounds.map(c => c.id === editingCompound.id ? updated : c));
      } else {
        const created = await compoundApi.create(formData);
        setCompounds([...compounds, created]);
      }

      setShowForm(false);
      setFormData({ name: '', unit: 'mg' });
      setEditingCompound(null);
    } catch (error) {
      console.error('Failed to save compound:', error);
      alert('Failed to save compound');
    } finally {
      setSaving(false);
    }
  };

  const filteredCompounds = compounds.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="manager-loading">Loading compounds...</div>;
  }

  return (
    <div className="manager">
      <div className="manager-header">
        <h2 className="manager-title">Compounds</h2>
        <div className="manager-actions">
          <input
            type="text"
            placeholder="Search compounds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="manager-search"
          />
          <button className="btn btn-primary" onClick={handleCreate}>
            + New Compound
          </button>
        </div>
      </div>

      <p className="manager-hint">
        Compounds are the active ingredients in supplements (e.g., Vitamin D3, Omega-3, Magnesium).
      </p>

      {showForm && (
        <div className="manager-form-overlay">
          <div className="manager-form-container small">
            <div className="manager-form-header">
              <h3>{editingCompound ? 'Edit Compound' : 'New Compound'}</h3>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="manager-form">
              <div className="form-group">
                <label className="form-label">Compound Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Vitamin D3, Omega-3, Magnesium"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value as CompoundUnit })}
                  className="form-select"
                >
                  {UNITS.map(unit => (
                    <option key={unit} value={unit}>
                      {unit} ({unit === 'mg' ? 'milligrams' : unit === 'g' ? 'grams' : unit === 'mcg' ? 'micrograms' : 'international units'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingCompound ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="manager-list">
        {filteredCompounds.length === 0 ? (
          <div className="manager-empty">
            {searchQuery ? 'No compounds match your search.' : 'No compounds yet. Create your first compound!'}
          </div>
        ) : (
          <div className="simple-list">
            {filteredCompounds.map((compound) => (
              <div key={compound.id} className="simple-list-item">
                <div className="item-info">
                  <span className="item-name">{compound.name}</span>
                  <span className="item-detail">{compound.unit}</span>
                </div>
                <div className="item-actions">
                  <button className="btn-icon" onClick={() => handleEdit(compound)} title="Edit">
                    ✏️
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDelete(compound)} title="Delete">
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

