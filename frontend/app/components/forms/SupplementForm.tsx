'use client';

import { useState, useEffect } from 'react';
import type { Supplement, Compound, CompoundUnit, SupplementCycle } from '../../types';
import { supplementApi, compoundApi, supplementCycleApi } from '../../api';

interface SupplementFormProps {
  onSubmit: (data: SupplementFormData) => void;
  onCancel: () => void;
}

// Single supplement entry (existing behavior)
interface SingleSupplementData {
  type: 'single';
  supplement_id?: number;
  servings: number;
  // For creating new supplement
  brand?: string;
  name?: string;
  serving_name?: string;
  compounds?: { compound_id: number; amount: number }[];
}

// Cycle day entry (new behavior - can contain multiple items)
interface CycleDayData {
  type: 'cycle';
  items: { supplement_id: number; servings: number }[];
}

export type SupplementFormData = SingleSupplementData | CycleDayData;

export default function SupplementForm({ onSubmit, onCancel }: SupplementFormProps) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [existingTab, setExistingTab] = useState<'supplement' | 'cycle'>('supplement');
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [compounds, setCompounds] = useState<Compound[]>([]);
  const [cycles, setCycles] = useState<SupplementCycle[]>([]);
  const [selectedSupplementId, setSelectedSupplementId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Servings (how many to take)
  const [servings, setServings] = useState(1);

  // Cycle selection
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  // New supplement fields
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [servingName, setServingName] = useState('');
  const [selectedCompounds, setSelectedCompounds] = useState<{ compound_id: number; amount: number }[]>([]);

  // New compound fields
  const [showNewCompound, setShowNewCompound] = useState(false);
  const [newCompoundName, setNewCompoundName] = useState('');
  const [newCompoundUnit, setNewCompoundUnit] = useState<CompoundUnit>('mg');

  useEffect(() => {
    Promise.all([supplementApi.getAll(), compoundApi.getAll(), supplementCycleApi.getAll()])
      .then(([supps, comps, cycs]) => {
        setSupplements(supps);
        setCompounds(comps);
        setCycles(cycs);
        if (supps.length > 0) {
          setSelectedSupplementId(supps[0].id);
        }
        if (cycs.length > 0) {
          setSelectedCycleId(cycs[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selectedCycle = cycles.find(c => c.id === selectedCycleId);
  const selectedDay = selectedCycle?.days[selectedDayIndex];

  // Get supplement items from the selected day (filter out compound-only items)
  const getDaySupplementItems = () => {
    if (!selectedDay) return [];
    return selectedDay.items
      .filter(item => item.supplement_id !== undefined)
      .map(item => ({
        supplement_id: item.supplement_id!,
        servings: item.amount,
        supplement: supplements.find(s => s.id === item.supplement_id),
      }));
  };

  // Get compound items from the selected day (items without supplement_id)
  const getDayCompoundItems = () => {
    if (!selectedDay) return [];
    return selectedDay.items
      .filter(item => item.compound_id !== undefined && item.supplement_id === undefined)
      .map(item => ({
        compound_id: item.compound_id!,
        amount: item.amount,
        compound: compounds.find(c => c.id === item.compound_id),
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'existing') {
      if (existingTab === 'supplement' && selectedSupplementId) {
        onSubmit({ type: 'single', supplement_id: selectedSupplementId, servings });
      } else if (existingTab === 'cycle' && selectedDay) {
        const supplementItems = getDaySupplementItems();
        if (supplementItems.length > 0) {
          onSubmit({
            type: 'cycle',
            items: supplementItems.map(item => ({
              supplement_id: item.supplement_id,
              servings: item.servings,
            })),
          });
        }
      }
    } else if (mode === 'new') {
      onSubmit({
        type: 'single',
        brand,
        name,
        serving_name: servingName,
        compounds: selectedCompounds,
        servings,
      });
    }
  };

  const addCompound = () => {
    if (compounds.length === 0) return;
    setSelectedCompounds([...selectedCompounds, { compound_id: compounds[0].id, amount: 0 }]);
  };

  const updateCompound = (index: number, field: 'compound_id' | 'amount', value: number) => {
    const newCompounds = [...selectedCompounds];
    newCompounds[index] = { ...newCompounds[index], [field]: value };
    setSelectedCompounds(newCompounds);
  };

  const removeCompound = (index: number) => {
    setSelectedCompounds(selectedCompounds.filter((_, i) => i !== index));
  };

  const createCompound = async () => {
    if (!newCompoundName.trim()) return;
    try {
      const response = await fetch('http://localhost:8000/compounds/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCompoundName, unit: newCompoundUnit }),
      });
      const created = await response.json();
      setCompounds([...compounds, created]);
      setShowNewCompound(false);
      setNewCompoundName('');
    } catch (error) {
      console.error('Failed to create compound:', error);
    }
  };

  const getCompoundById = (id: number) => compounds.find(c => c.id === id);

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <div className="mode-toggle">
          <button
            type="button"
            className={`mode-btn ${mode === 'existing' ? 'active' : ''}`}
            onClick={() => setMode('existing')}
          >
            Use Existing
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === 'new' ? 'active' : ''}`}
            onClick={() => setMode('new')}
          >
            Create New
          </button>
        </div>
      </div>

      {mode === 'existing' ? (
        <>
          <div className="form-group">
            <div className="sub-tab-toggle">
              <button
                type="button"
                className={`sub-tab-btn ${existingTab === 'supplement' ? 'active' : ''}`}
                onClick={() => setExistingTab('supplement')}
              >
                Select Supplement
              </button>
              <button
                type="button"
                className={`sub-tab-btn ${existingTab === 'cycle' ? 'active' : ''}`}
                onClick={() => setExistingTab('cycle')}
              >
                Select Cycle
              </button>
            </div>
          </div>

          {existingTab === 'supplement' ? (
            <>
              <div className="form-group">
                <label className="form-label">Select Supplement</label>
                {loading ? (
                  <div className="form-loading">Loading supplements...</div>
                ) : supplements.length === 0 ? (
                  <div className="form-empty">No supplements available. Create one first.</div>
                ) : (
                  <select
                    value={selectedSupplementId || ''}
                    onChange={(e) => setSelectedSupplementId(parseInt(e.target.value))}
                    className="form-select"
                    required
                  >
                    {supplements.map((supp) => (
                      <option key={supp.id} value={supp.id}>
                        {supp.brand} - {supp.name} ({supp.serving_name})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">How many servings?</label>
                <div className="servings-selector">
                  <button
                    type="button"
                    className="btn btn-secondary btn-icon"
                    onClick={() => setServings(Math.max(1, servings - 1))}
                  >
                    −
                  </button>
                  <span className="servings-value">{servings}</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-icon"
                    onClick={() => setServings(servings + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Select Cycle</label>
                {loading ? (
                  <div className="form-loading">Loading cycles...</div>
                ) : cycles.length === 0 ? (
                  <div className="form-empty">No supplement cycles available. Create one in the Supplement Cycles manager.</div>
                ) : (
                  <select
                    value={selectedCycleId || ''}
                    onChange={(e) => {
                      setSelectedCycleId(parseInt(e.target.value));
                      setSelectedDayIndex(0);
                    }}
                    className="form-select"
                  >
                    {cycles.map((cycle) => (
                      <option key={cycle.id} value={cycle.id}>
                        {cycle.name} ({cycle.days.length} days)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedCycle && (
                <div className="form-group">
                  <label className="form-label">Select Day</label>
                  <div className="cycle-day-selector">
                    {selectedCycle.days.map((day, index) => (
                      <button
                        key={day.id}
                        type="button"
                        className={`cycle-day-btn ${selectedDayIndex === index ? 'active' : ''}`}
                        onClick={() => setSelectedDayIndex(index)}
                      >
                        Day {index + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDay && (
                <div className="form-group">
                  <label className="form-label">Items to Add</label>
                  <div className="cycle-day-preview">
                    {getDaySupplementItems().length > 0 && (
                      <div className="preview-section">
                        <div className="preview-header">⚡ Supplements</div>
                        {getDaySupplementItems().map((item, idx) => (
                          <div key={idx} className="preview-item">
                            <span className="preview-name">
                              {item.supplement ? `${item.supplement.brand} ${item.supplement.name}` : 'Unknown Supplement'}
                            </span>
                            <span className="preview-amount">{item.servings} serving(s)</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {getDayCompoundItems().length > 0 && (
                      <div className="preview-section">
                        <div className="preview-header">🧪 Compounds (not added)</div>
                        <div className="preview-note">
                          Standalone compounds cannot be added directly. They must be part of a supplement.
                        </div>
                        {getDayCompoundItems().map((item, idx) => (
                          <div key={idx} className="preview-item muted">
                            <span className="preview-name">
                              {item.compound ? item.compound.name : 'Unknown Compound'}
                            </span>
                            <span className="preview-amount">
                              {item.amount} {item.compound?.unit || ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {getDaySupplementItems().length === 0 && getDayCompoundItems().length === 0 && (
                      <div className="preview-empty">No items in this day</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <div className="form-group">
            <label className="form-label">Brand</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="form-input"
              placeholder="e.g., Nordic Naturals"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="e.g., Ultimate Omega"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Serving Name</label>
            <input
              type="text"
              value={servingName}
              onChange={(e) => setServingName(e.target.value)}
              className="form-input"
              placeholder="e.g., 2 softgels"
              required
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">Compounds</label>
              <button
                type="button"
                className="btn-add-small"
                onClick={() => setShowNewCompound(!showNewCompound)}
              >
                {showNewCompound ? 'Cancel' : '+ New Compound'}
              </button>
            </div>

            {showNewCompound && (
              <div className="new-compound-form">
                <input
                  type="text"
                  value={newCompoundName}
                  onChange={(e) => setNewCompoundName(e.target.value)}
                  className="form-input"
                  placeholder="Compound name (e.g., Vitamin D3)"
                />
                <select
                  value={newCompoundUnit}
                  onChange={(e) => setNewCompoundUnit(e.target.value as CompoundUnit)}
                  className="form-select"
                >
                  <option value="mg">mg</option>
                  <option value="mcg">mcg</option>
                  <option value="g">g</option>
                  <option value="iu">IU</option>
                </select>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={createCompound}
                  disabled={!newCompoundName.trim()}
                >
                  Create
                </button>
              </div>
            )}

            <button
              type="button"
              className="btn-add-small"
              onClick={addCompound}
              disabled={compounds.length === 0}
              style={{ marginTop: '0.5rem' }}
            >
              + Add Compound
            </button>

            {selectedCompounds.map((sc, index) => {
              const compound = getCompoundById(sc.compound_id);
              return (
                <div key={index} className="compound-item">
                  <select
                    value={sc.compound_id}
                    onChange={(e) => updateCompound(index, 'compound_id', parseInt(e.target.value))}
                    className="form-select"
                  >
                    {compounds.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={sc.amount}
                    onChange={(e) => updateCompound(index, 'amount', parseFloat(e.target.value) || 0)}
                    className="form-input amount-input"
                  />
                  <span className="form-hint">{compound?.unit}</span>
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

          <div className="form-group">
            <label className="form-label">How many servings?</label>
            <div className="servings-selector">
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={() => setServings(Math.max(1, servings - 1))}
              >
                −
              </button>
              <span className="servings-value">{servings}</span>
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={() => setServings(servings + 1)}
              >
                +
              </button>
            </div>
          </div>
        </>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={
            mode === 'existing'
              ? existingTab === 'supplement'
                ? !selectedSupplementId
                : getDaySupplementItems().length === 0
              : !brand || !name || !servingName
          }
        >
          {mode === 'existing' && existingTab === 'cycle' 
            ? `Add ${getDaySupplementItems().length} Supplement${getDaySupplementItems().length !== 1 ? 's' : ''}`
            : 'Save Supplement'
          }
        </button>
      </div>
    </form>
  );
}

