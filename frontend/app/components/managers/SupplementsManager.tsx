'use client';

import { useState, useEffect } from 'react';
import type { Supplement, Compound, CompoundUnit } from '../../types';
import { supplementApi, compoundApi } from '../../api';
import { useConfirmDialog } from '../ConfirmDialog';

interface CompoundInput {
  compound_id: number;
  amount: string;
}

const COMPOUND_UNITS: CompoundUnit[] = ['mg', 'g', 'mcg', 'iu'];

export default function SupplementsManager() {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [compounds, setCompounds] = useState<Compound[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplement, setEditingSupplement] = useState<Supplement | null>(null);
  const [formData, setFormData] = useState({
    brand: '',
    name: '',
    serving_name: '',
    compounds: [] as CompoundInput[],
  });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSupplement, setExpandedSupplement] = useState<number | null>(null);
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  
  // New compound form state
  const [showNewCompoundForm, setShowNewCompoundForm] = useState(false);
  const [newCompoundName, setNewCompoundName] = useState('');
  const [newCompoundUnit, setNewCompoundUnit] = useState<CompoundUnit>('mg');
  const [creatingCompound, setCreatingCompound] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [supplementsData, compoundsData] = await Promise.all([
        supplementApi.getAll(),
        compoundApi.getAll()
      ]);
      setSupplements(supplementsData);
      setCompounds(compoundsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSupplement(null);
    setFormData({
      brand: '',
      name: '',
      serving_name: '1 serving',
      compounds: [],
    });
    setShowForm(true);
  };

  const handleEdit = (supplement: Supplement) => {
    setEditingSupplement(supplement);
    setFormData({
      brand: supplement.brand,
      name: supplement.name,
      serving_name: supplement.serving_name,
      compounds: supplement.compounds.map(sc => ({
        compound_id: sc.compound.id,
        amount: String(sc.amount),
      })),
    });
    setShowForm(true);
  };

  const handleDelete = async (supplement: Supplement) => {
    const confirmed = await confirm({
      title: 'Delete Supplement',
      message: `Are you sure you want to delete "${supplement.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      await supplementApi.delete(supplement.id);
      setSupplements(supplements.filter(s => s.id !== supplement.id));
    } catch (error) {
      console.error('Failed to delete supplement:', error);
    }
  };

  const addCompound = () => {
    if (compounds.length === 0) {
      // If no compounds exist, show the create form
      setShowNewCompoundForm(true);
      return;
    }
    setFormData({
      ...formData,
      compounds: [...formData.compounds, { compound_id: compounds[0].id, amount: '' }],
    });
  };

  const handleCreateCompound = async () => {
    if (!newCompoundName.trim()) return;
    
    setCreatingCompound(true);
    try {
      const created = await compoundApi.create({
        name: newCompoundName.trim(),
        unit: newCompoundUnit,
      });
      setCompounds([...compounds, created]);
      // Add the newly created compound to the form
      setFormData({
        ...formData,
        compounds: [...formData.compounds, { compound_id: created.id, amount: '' }],
      });
      // Reset the new compound form
      setNewCompoundName('');
      setNewCompoundUnit('mg');
      setShowNewCompoundForm(false);
    } catch (error) {
      console.error('Failed to create compound:', error);
      alert('Failed to create compound');
    } finally {
      setCreatingCompound(false);
    }
  };

  const updateCompound = (index: number, field: 'compound_id' | 'amount', value: string | number) => {
    const newCompounds = [...formData.compounds];
    newCompounds[index] = { ...newCompounds[index], [field]: value };
    setFormData({ ...formData, compounds: newCompounds });
  };

  const removeCompound = (index: number) => {
    setFormData({
      ...formData,
      compounds: formData.compounds.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      const supplementData = {
        brand: formData.brand,
        name: formData.name,
        serving_name: formData.serving_name,
        compounds: formData.compounds.map(c => ({
          compound_id: c.compound_id,
          amount: parseFloat(c.amount) || 0,
        })),
      };

      if (editingSupplement) {
        await supplementApi.delete(editingSupplement.id);
        const created = await supplementApi.create(supplementData);
        setSupplements(supplements.map(s => s.id === editingSupplement.id ? created : s));
      } else {
        const created = await supplementApi.create(supplementData);
        setSupplements([...supplements, created]);
      }

      setShowForm(false);
      setFormData({ brand: '', name: '', serving_name: '', compounds: [] });
      setEditingSupplement(null);
      loadData();
    } catch (error) {
      console.error('Failed to save supplement:', error);
      alert('Failed to save supplement');
    } finally {
      setSaving(false);
    }
  };

  const getCompoundById = (id: number) => compounds.find(c => c.id === id);

  const filteredSupplements = supplements.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="manager-loading">Loading supplements...</div>;
  }

  return (
    <div className="manager">
      <div className="manager-header">
        <h2 className="manager-title">Supplements</h2>
        <div className="manager-actions">
          <input
            type="text"
            placeholder="Search supplements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="manager-search"
          />
          <button className="btn btn-primary" onClick={handleCreate}>
            + New Supplement
          </button>
        </div>
      </div>

      {showForm && (
        <div className="manager-form-overlay">
          <div className="manager-form-container">
            <div className="manager-form-header">
              <h3>{editingSupplement ? 'Edit Supplement' : 'New Supplement'}</h3>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="manager-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="form-input"
                    placeholder="e.g., NOW Foods"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                    placeholder="e.g., Vitamin D3"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Serving Name</label>
                <input
                  type="text"
                  value={formData.serving_name}
                  onChange={(e) => setFormData({ ...formData, serving_name: e.target.value })}
                  className="form-input"
                  placeholder="e.g., 1 capsule, 2 softgels"
                />
              </div>

              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label">Compounds</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn-add-small"
                      onClick={addCompound}
                    >
                      + Add Compound
                    </button>
                    <button
                      type="button"
                      className="btn-add-small"
                      onClick={() => setShowNewCompoundForm(true)}
                      style={{ borderColor: 'var(--accent-success)', color: 'var(--accent-success)' }}
                    >
                      + New Compound
                    </button>
                  </div>
                </div>
                
                {/* New Compound Form */}
                {showNewCompoundForm && (
                  <div className="new-compound-form">
                    <input
                      type="text"
                      value={newCompoundName}
                      onChange={(e) => setNewCompoundName(e.target.value)}
                      className="form-input"
                      placeholder="Compound name (e.g., Vitamin D3)"
                      autoFocus
                    />
                    <select
                      value={newCompoundUnit}
                      onChange={(e) => setNewCompoundUnit(e.target.value as CompoundUnit)}
                      className="form-select"
                      style={{ width: '80px' }}
                    >
                      {COMPOUND_UNITS.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleCreateCompound}
                      disabled={creatingCompound || !newCompoundName.trim()}
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      {creatingCompound ? '...' : 'Create'}
                    </button>
                    <button
                      type="button"
                      className="btn-remove-small"
                      onClick={() => {
                        setShowNewCompoundForm(false);
                        setNewCompoundName('');
                        setNewCompoundUnit('mg');
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
                
                {compounds.length === 0 && !showNewCompoundForm && (
                  <p className="form-hint">No compounds yet. Click &quot;+ New Compound&quot; to create one.</p>
                )}
                {formData.compounds.map((comp, index) => {
                  const compound = getCompoundById(comp.compound_id);
                  return (
                    <div key={index} className="compound-row">
                      <select
                        value={comp.compound_id}
                        onChange={(e) => updateCompound(index, 'compound_id', parseInt(e.target.value))}
                        className="form-select"
                      >
                        {compounds.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={comp.amount}
                        onChange={(e) => updateCompound(index, 'amount', e.target.value)}
                        className="form-input"
                        placeholder="Amount"
                      />
                      <span className="compound-unit">{compound?.unit || ''}</span>
                      <button
                        type="button"
                        className="btn-remove-small"
                        onClick={() => removeCompound(index)}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingSupplement ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="manager-list">
        {filteredSupplements.length === 0 ? (
          <div className="manager-empty">
            {searchQuery ? 'No supplements match your search.' : 'No supplements yet. Create your first supplement!'}
          </div>
        ) : (
          <div className="supplements-cards">
            {filteredSupplements.map((supplement) => {
              const isExpanded = expandedSupplement === supplement.id;
              return (
                <div key={supplement.id} className={`supplement-card ${isExpanded ? 'expanded' : ''}`}>
                  <div className="supplement-card-header" onClick={() => setExpandedSupplement(isExpanded ? null : supplement.id)}>
                    <div className="supplement-card-info">
                      <h3 className="supplement-card-name">
                        {supplement.brand && <span className="supplement-brand">{supplement.brand}</span>}
                        {supplement.name}
                      </h3>
                      <span className="supplement-serving">{supplement.serving_name}</span>
                    </div>
                    <div className="supplement-card-actions">
                      <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                      <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleEdit(supplement); }} title="Edit">
                        ✏️
                      </button>
                      <button className="btn-icon danger" onClick={(e) => { e.stopPropagation(); handleDelete(supplement); }} title="Delete">
                        🗑️
                      </button>
                    </div>
                  </div>
                  {isExpanded && supplement.compounds.length > 0 && (
                    <div className="supplement-compounds">
                      {supplement.compounds.map((sc, idx) => (
                        <div key={idx} className="compound-pill">
                          {sc.compound.name}: {sc.amount} {sc.compound.unit}
                        </div>
                      ))}
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

