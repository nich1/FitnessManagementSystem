'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LogEntry, QuickStatCardConfig, MetricType } from '../types';
import { statsApi, logEntryApi } from '../api';

const METRIC_LABELS: Record<string, string> = {
  weight: 'Weight',
  morning_weight: 'Morning Weight',
  weight_vs_last_week_avg: 'Weight vs Last Week Avg',
  calories: 'Calories',
  protein: 'Protein',
  complete_protein: 'Complete Protein',
  carbs: 'Carbs',
  fat: 'Fat',
  fiber: 'Fiber',
  sugar: 'Sugar',
  workout_count: 'Workouts',
  total_sets: 'Sets',
  total_reps: 'Total Reps',
  total_volume: 'Total Volume',
  cardio_minutes: 'Cardio (min)',
  cardio_sessions: 'Cardio Sessions',
  sleep_duration: 'Sleep (hrs)',
  sleep_quality: 'Sleep Quality',
  hydration_oz: 'Water (oz)',
  supplement_count: 'Supplements',
  stress_level: 'Stress',
  alcohol_drinks: 'Drinks',
  drinks: 'Drinks',
  carb_day: 'Carb Day',
  notes: 'Notes',
};

const METRIC_UNITS: Record<string, string> = {
  weight: 'lb',
  morning_weight: 'lb',
  weight_vs_last_week_avg: 'lb',
  calories: 'cal',
  protein: 'g',
  complete_protein: 'g',
  carbs: 'g',
  fat: 'g',
  fiber: 'g',
  sugar: 'g',
  added_sugar: 'g',
  saturated_fat: 'g',
  monounsaturated_fat: 'g',
  polyunsaturated_fat: 'g',
  trans_fat: 'g',
  cholesterol: 'mg',
  total_volume: 'lb',
  cardio_minutes: 'min',
  hydration_oz: 'oz',
  // Note: sleep_duration has no unit here - it's formatted as "Xh Ym" in formatValue
};

const METRIC_COLORS: Record<string, string> = {
  weight: 'var(--text-primary)',
  morning_weight: 'var(--text-primary)',
  calories: 'var(--accent-warning)',
  protein: 'var(--accent-success)',
  complete_protein: 'var(--accent-success)',
  carbs: 'var(--accent-warning)',
  fat: 'var(--accent-danger)',
  total_sets: 'var(--accent-primary)',
  total_volume: 'var(--accent-primary)',
  cardio_minutes: 'var(--accent-secondary)',
  supplement_count: 'var(--text-secondary)',
  drinks: 'var(--accent-warning)',
  alcohol_drinks: 'var(--accent-warning)',
};

const DEFAULT_CARDS: QuickStatCardConfig[] = [
  {
    id: 'weight',
    label: 'Morning Weight',
    metric: 'morning_weight',
    displayMode: 'value',
    color: 'var(--text-primary)',
    unit: 'lb',
  },
  {
    id: 'weight-change',
    label: 'Weight vs Last Week',
    metric: 'weight',
    displayMode: 'comparison',
    comparisonPeriod: 'last_7_days',
    color: 'var(--accent-primary)',
    unit: 'lb',
    decimals: 1,
  },
  {
    id: 'total-volume',
    label: 'Total Volume',
    metric: 'total_volume',
    displayMode: 'value',
    color: 'var(--accent-primary)',
    unit: 'lb',
  },
  {
    id: 'sets',
    label: 'Sets',
    metric: 'total_sets',
    displayMode: 'value',
    color: 'var(--accent-primary)',
  },
  {
    id: 'stress',
    label: 'Stress Level',
    metric: 'stress_level',
    displayMode: 'value',
    color: 'var(--accent-secondary)',
  },
  {
    id: 'saturated-fat',
    label: 'Saturated Fat',
    metric: 'saturated_fat',
    displayMode: 'value',
    color: 'var(--accent-danger)',
    unit: 'g',
  },
  {
    id: 'complete-protein',
    label: 'Complete Protein',
    metric: 'complete_protein',
    displayMode: 'value',
    color: 'var(--accent-success)',
    unit: 'g',
  },
  {
    id: 'cardio',
    label: 'Cardio',
    metric: 'cardio_minutes',
    displayMode: 'value',
    color: 'var(--accent-danger)',
    unit: 'min',
  },
];

const STORAGE_KEY = 'quickStatCards';

interface QuickStatsProps {
  logEntry?: LogEntry | null;
  selectedDate: Date;
  onEdit?: () => void;
}

interface CardValue {
  value: number | string | null;
  comparison?: {
    previousValue: number | null;
    change: number | null;
    percentChange: number | null;
  };
}

export default function QuickStats({ logEntry, selectedDate, onEdit }: QuickStatsProps) {
  const [cards, setCards] = useState<QuickStatCardConfig[]>([]);
  const [cardValues, setCardValues] = useState<Record<string, CardValue>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingCard, setEditingCard] = useState<QuickStatCardConfig | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);

  // Load cards from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCards(JSON.parse(saved));
      } catch {
        setCards(DEFAULT_CARDS);
      }
    } else {
      setCards(DEFAULT_CARDS);
    }
  }, []);

  // Save cards to localStorage
  const saveCards = useCallback((newCards: QuickStatCardConfig[]) => {
    setCards(newCards);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCards));
  }, []);

  // Calculate values for all cards
  useEffect(() => {
    if (!logEntry && cards.length === 0) return;

    const calculateValues = async () => {
      const values: Record<string, CardValue> = {};
      // Use local timezone, not UTC (toISOString converts to UTC which causes date shifts)
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      console.log('QuickStats - Calculating values for cards:', cards.map(c => ({ id: c.id, metric: c.metric })));

      for (const card of cards) {
        console.log('QuickStats - Processing card:', card.id, 'metric:', card.metric);
        try {
          // Special handling for weight_vs_last_week_avg metric
          if (card.metric === 'weight_vs_last_week_avg') {
            console.log('QuickStats - Matched weight_vs_last_week_avg!');
            const weightVsLastWeek = await getWeightVsLastWeekAvg(dateStr, logEntry);
            values[card.id] = weightVsLastWeek;
          } else if (card.displayMode === 'value') {
            // Simple day value
            values[card.id] = { value: getDayValue(card, logEntry) };
          } else if (card.displayMode === 'comparison') {
            // Comparison with previous period
            const comparison = await getComparisonValue(card, dateStr, logEntry);
            values[card.id] = comparison;
          }
        } catch (error) {
          console.error(`Error calculating value for card ${card.id}:`, error);
          values[card.id] = { value: null };
        }
      }

      setCardValues(values);
    };

    calculateValues();
  }, [cards, logEntry, selectedDate]);

  // Get value for a simple day metric
  const getDayValue = (card: QuickStatCardConfig, entry: LogEntry | null | undefined): number | string | null => {
    if (!entry) return null;

    switch (card.metric) {
      case 'morning_weight':
        return entry.morning_weight ?? null;
      case 'drinks':
      case 'alcohol_drinks':
        return entry.num_standard_drinks ?? 0;
      case 'total_sets':
        return entry.activities?.reduce((sum, a) => 
          sum + a.exercises.reduce((exSum, ex) => exSum + ex.sets.length, 0), 0
        ) ?? 0;
      case 'total_reps':
        return entry.activities?.reduce((sum, a) => 
          sum + a.exercises.reduce((exSum, ex) => 
            exSum + ex.sets.reduce((setSum, s) => setSum + s.reps, 0), 0
          ), 0
        ) ?? 0;
      case 'total_volume':
        return entry.activities?.reduce((sum, a) => 
          sum + a.exercises.reduce((exSum, ex) => 
            exSum + ex.sets.reduce((setSum, s) => setSum + (s.weight * s.reps), 0), 0
          ), 0
        ) ?? 0;
      case 'cardio_minutes':
        return entry.cardio?.reduce((sum, c) => sum + (c.exercise.duration_minutes || 0), 0) ?? 0;
      case 'supplement_count':
        return entry.supplements?.length ?? 0;
      case 'calories':
        return entry.foods?.reduce((sum, f) => sum + (f.food.calories * f.servings), 0) ?? 0;
      case 'protein':
        return entry.foods?.reduce((sum, f) => sum + (f.food.protein.grams * f.servings), 0) ?? 0;
      case 'complete_protein':
        return entry.foods?.reduce((sum, f) => {
          if (f.food.protein.complete_amino_acid_profile) {
            return sum + (f.food.protein.grams * f.servings);
          }
          return sum;
        }, 0) ?? 0;
      case 'carbs':
        return entry.foods?.reduce((sum, f) => sum + (f.food.carbs.grams * f.servings), 0) ?? 0;
      case 'fat':
        return entry.foods?.reduce((sum, f) => sum + (f.food.fat.grams * f.servings), 0) ?? 0;
      case 'fiber':
        return entry.foods?.reduce((sum, f) => sum + ((f.food.carbs.fiber ?? 0) * f.servings), 0) ?? 0;
      case 'sugar':
        return entry.foods?.reduce((sum, f) => sum + ((f.food.carbs.sugar ?? 0) * f.servings), 0) ?? 0;
      case 'added_sugar':
        return entry.foods?.reduce((sum, f) => sum + ((f.food.carbs.added_sugars ?? 0) * f.servings), 0) ?? 0;
      case 'saturated_fat':
        return entry.foods?.reduce((sum, f) => sum + ((f.food.fat.saturated ?? 0) * f.servings), 0) ?? 0;
      case 'monounsaturated_fat':
        return entry.foods?.reduce((sum, f) => sum + ((f.food.fat.monounsaturated ?? 0) * f.servings), 0) ?? 0;
      case 'polyunsaturated_fat':
        return entry.foods?.reduce((sum, f) => sum + ((f.food.fat.polyunsaturated ?? 0) * f.servings), 0) ?? 0;
      case 'trans_fat':
        return entry.foods?.reduce((sum, f) => sum + ((f.food.fat.trans ?? 0) * f.servings), 0) ?? 0;
      case 'cholesterol':
        return entry.foods?.reduce((sum, f) => sum + ((f.food.fat.cholesterol ?? 0) * f.servings), 0) ?? 0;
      case 'carb_day':
        return entry.carb_cycle?.selected_day.day_type ?? null;
      case 'notes':
        return entry.notes ?? null;
      case 'sleep_duration':
        // Return minutes, will be formatted as hours:minutes in formatValue
        return entry.sleep?.duration ?? null;
      case 'sleep_quality':
        return entry.sleep?.quality ?? null;
      case 'hydration_oz':
        // Convert to oz if needed
        return entry.hydration?.reduce((sum, h) => {
          const amount = h.cup.amount * h.servings;
          // Convert ml to oz if needed
          if (h.cup.unit === 'ml') {
            return sum + (amount / 29.5735);
          } else if (h.cup.unit === 'l') {
            return sum + (amount * 33.814);
          }
          return sum + amount; // already oz
        }, 0) ?? 0;
      case 'stress_level':
        if (!entry.stress) return null;
        // Convert stress level to display string
        const stressLabels: Record<string, string> = {
          'very_low': 'Very Low',
          'low': 'Low',
          'medium': 'Medium',
          'high': 'High',
          'very_high': 'Very High',
        };
        return stressLabels[entry.stress.level] || entry.stress.level;
      default:
        return null;
    }
  };

  // Get weight vs last week's average (same calculation as Weight Manager)
  const getWeightVsLastWeekAvg = async (
    currentDateStr: string,
    entry: LogEntry | null | undefined
  ): Promise<CardValue> => {
    const todayWeight = entry?.morning_weight ?? null;
    
    try {
      // Get entries for the past 14 days to calculate last week's average
      // Use T12:00:00 to avoid timezone edge cases (noon is safely in the middle of the day)
      const endDate = new Date(currentDateStr + 'T12:00:00');
      const startDate = new Date(currentDateStr + 'T12:00:00');
      startDate.setDate(startDate.getDate() - 14);
      
      // Format dates for API using local timezone
      const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      console.log('Weight vs Last Week - Query params:', {
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        todayWeight,
        currentDateStr,
      });

      const response = await statsApi.query({
        metrics: ['weight'],
        date_range_type: 'custom',
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        aggregation: 'daily',
      });

      console.log('Weight vs Last Week - API response:', response);

      const metricData = response.metrics[0];
      if (!metricData) {
        console.log('Weight vs Last Week - No metric data returned');
        return { value: todayWeight };
      }

      console.log('Weight vs Last Week - Metric data:', metricData.data);

      // Get entries from the past 7 days (excluding today)
      const lastWeekData = metricData.data.filter(d => {
        const dDate = new Date(d.date + 'T12:00:00');
        const daysDiff = Math.floor((endDate.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`  Date: ${d.date}, value: ${d.value}, daysDiff: ${daysDiff}, included: ${daysDiff >= 1 && daysDiff <= 7 && d.value !== null}`);
        return daysDiff >= 1 && daysDiff <= 7 && d.value !== null;
      });

      console.log('Weight vs Last Week - Filtered data (last 7 days):', lastWeekData);

      const lastWeekAvg = lastWeekData.length > 0
        ? lastWeekData.reduce((sum, d) => sum + (d.value ?? 0), 0) / lastWeekData.length
        : null;

      console.log('Weight vs Last Week - Result:', { todayWeight, lastWeekAvg, change: todayWeight !== null && lastWeekAvg !== null ? todayWeight - lastWeekAvg : null });

      const change = todayWeight !== null && lastWeekAvg !== null 
        ? todayWeight - lastWeekAvg 
        : null;
      const percentChange = change !== null && lastWeekAvg !== null && lastWeekAvg !== 0
        ? (change / lastWeekAvg) * 100
        : null;

      return {
        value: todayWeight,
        comparison: {
          previousValue: lastWeekAvg,
          change,
          percentChange,
        },
      };
    } catch (error) {
      console.error('Error fetching weight vs last week:', error);
      return { value: todayWeight };
    }
  };

  // Get comparison value
  const getComparisonValue = async (
    card: QuickStatCardConfig, 
    currentDateStr: string,
    entry: LogEntry | null | undefined
  ): Promise<CardValue> => {
    const todayValue = getDayValue(card, entry);
    
    // Calculate date range based on comparison period
    const endDate = new Date(currentDateStr);
    let startDate = new Date(currentDateStr);
    
    switch (card.comparisonPeriod) {
      case 'yesterday':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'last_7_days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last_14_days':
        startDate.setDate(startDate.getDate() - 14);
        break;
      case 'last_30_days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'last_week_avg':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last_month_avg':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    try {
      // Query stats API for the comparison period
      const response = await statsApi.query({
        metrics: [card.metric as MetricType],
        date_range_type: 'custom',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        aggregation: 'daily',
      });

      const metricData = response.metrics[0];
      if (!metricData) {
        return { value: todayValue };
      }

      // Calculate average of previous period (excluding today)
      const previousData = metricData.data.filter(d => d.date !== currentDateStr && d.value !== null);
      const previousAvg = previousData.length > 0
        ? previousData.reduce((sum, d) => sum + (d.value ?? 0), 0) / previousData.length
        : null;

      const currentValue = typeof todayValue === 'number' ? todayValue : null;
      const change = currentValue !== null && previousAvg !== null 
        ? currentValue - previousAvg 
        : null;
      const percentChange = change !== null && previousAvg !== null && previousAvg !== 0
        ? (change / previousAvg) * 100
        : null;

      return {
        value: currentValue,
        comparison: {
          previousValue: previousAvg,
          change,
          percentChange,
        },
      };
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      return { value: todayValue };
    }
  };

  const handleAddCard = (config: Partial<QuickStatCardConfig>) => {
    const newCard: QuickStatCardConfig = {
      id: `card-${Date.now()}`,
      label: config.label || 'New Stat',
      metric: config.metric || 'calories',
      displayMode: config.displayMode || 'value',
      comparisonPeriod: config.comparisonPeriod,
      color: config.color || METRIC_COLORS[config.metric || 'calories'] || 'var(--text-primary)',
      unit: config.unit || METRIC_UNITS[config.metric || ''],
      decimals: config.decimals,
    };
    saveCards([...cards, newCard]);
    setShowAddCard(false);
  };

  const handleUpdateCard = (updatedCard: QuickStatCardConfig) => {
    const newCards = cards.map(c => c.id === updatedCard.id ? updatedCard : c);
    saveCards(newCards);
    setEditingCard(null);
  };

  const handleDeleteCard = (cardId: string) => {
    saveCards(cards.filter(c => c.id !== cardId));
  };

  const handleMoveCard = (cardId: string, direction: 'left' | 'right') => {
    const idx = cards.findIndex(c => c.id === cardId);
    if (idx === -1) return;
    
    const newIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= cards.length) return;
    
    const newCards = [...cards];
    [newCards[idx], newCards[newIdx]] = [newCards[newIdx], newCards[idx]];
    saveCards(newCards);
  };

  const resetToDefaults = () => {
    saveCards(DEFAULT_CARDS);
  };

  const formatValue = (card: QuickStatCardConfig, value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string') return value;
    
    // Special formatting for sleep duration (convert minutes to hours:minutes)
    if (card.metric === 'sleep_duration') {
      const hours = Math.floor(value / 60);
      const minutes = Math.round(value % 60);
      return `${hours}h ${minutes}m`;
    }
    
    // Weight metrics should show 1 decimal by default
    const isWeightMetric = card.metric === 'morning_weight' || card.metric === 'weight';
    const decimals = card.decimals ?? (isWeightMetric ? 1 : 0);
    const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();
    return card.unit ? `${formatted}` : formatted;
  };

  const renderCard = (card: QuickStatCardConfig) => {
    const cardValue = cardValues[card.id];
    const value = cardValue?.value;
    const comparison = cardValue?.comparison;

    // Special rendering for weight_vs_last_week_avg - show change as the main value
    const isWeightVsLastWeek = card.metric === 'weight_vs_last_week_avg';

    return (
      <div key={card.id} className="quick-stat-card">
        {isEditing && (
          <div className="quick-stat-card-controls">
            <button 
              className="card-control-btn"
              onClick={() => handleMoveCard(card.id, 'left')}
              title="Move left"
            >
              ←
            </button>
            <button 
              className="card-control-btn"
              onClick={() => setEditingCard(card)}
              title="Edit"
            >
              ✎
            </button>
            <button 
              className="card-control-btn card-control-delete"
              onClick={() => handleDeleteCard(card.id)}
              title="Delete"
            >
              ×
            </button>
            <button 
              className="card-control-btn"
              onClick={() => handleMoveCard(card.id, 'right')}
              title="Move right"
            >
              →
            </button>
          </div>
        )}
        
        {isWeightVsLastWeek ? (
          // Special display for weight vs last week - show change as main value
          <div 
            className="quick-stat-value" 
            style={{ 
              color: comparison?.change != null 
                ? (comparison.change > 0 ? 'var(--accent-danger)' : comparison.change < 0 ? 'var(--accent-success)' : 'var(--text-secondary)')
                : 'var(--text-secondary)'
            }}
          >
            {comparison?.change != null ? (
              <>
                <span className="weight-change-arrow">{comparison.change > 0 ? '▲' : comparison.change < 0 ? '▼' : ''}</span>
                {' '}{comparison.change > 0 ? '+' : ''}{comparison.change.toFixed(1)}
                <span className="quick-stat-unit">lb</span>
              </>
            ) : (
              '—'
            )}
          </div>
        ) : (
          <div className="quick-stat-value" style={{ color: card.color || 'var(--text-primary)' }}>
            {formatValue(card, value)}
            {card.unit && <span className="quick-stat-unit">{card.unit}</span>}
          </div>
        )}
        
        {card.displayMode === 'comparison' && !isWeightVsLastWeek && comparison && (
          <div className={`quick-stat-change ${comparison.change !== null && comparison.change >= 0 ? 'positive' : 'negative'}`}>
            {comparison.change !== null ? (
              <>
                <span className="change-arrow">{comparison.change >= 0 ? '↑' : '↓'}</span>
                <span className="change-value">
                  {Math.abs(comparison.change).toFixed(1)}
                  {comparison.percentChange !== null && (
                    <span className="change-percent"> ({Math.abs(comparison.percentChange).toFixed(1)}%)</span>
                  )}
                </span>
              </>
            ) : (
              <span className="change-na">—</span>
            )}
          </div>
        )}
        
        <div className="quick-stat-label">{card.label}</div>
      </div>
    );
  };

  return (
    <div className="section-card" style={{ gridColumn: '1 / -1' }}>
      <div className="section-header">
        <div className="section-title">
          <span className="section-icon">📊</span>
          Quick Stats
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {logEntry?.phase && <span className="section-badge">{logEntry.phase.name}</span>}
          {isEditing ? (
            <>
              <button 
                className="quick-stat-edit-btn" 
                onClick={resetToDefaults}
                title="Reset to defaults"
              >
                ↺
              </button>
              <button 
                className="quick-stat-edit-btn" 
                onClick={() => setShowAddCard(true)}
                title="Add card"
              >
                +
              </button>
              <button 
                className="quick-stat-edit-btn done" 
                onClick={() => setIsEditing(false)}
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button 
                className="quick-stat-edit-btn" 
                onClick={() => setIsEditing(true)}
                title="Customize cards"
              >
                ⚙
              </button>
              {onEdit && (
                <button className="section-add-btn" onClick={onEdit} aria-label="Edit quick stats">
                  ✎
                </button>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="section-content">
        <div className="quick-stats-grid">
          {cards.map(renderCard)}
          {isEditing && (
            <button 
              className="quick-stat-card add-card-btn"
              onClick={() => setShowAddCard(true)}
            >
              <span className="add-card-icon">+</span>
              <span className="add-card-label">Add Stat</span>
            </button>
          )}
        </div>

        {logEntry?.notes && (
          <div className="notes-content" style={{ marginTop: '1.5rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Notes:</strong> {logEntry.notes}
          </div>
        )}
      </div>

      {/* Add/Edit Card Modal */}
      {(showAddCard || editingCard) && (
        <CardEditorModal
          card={editingCard}
          onSave={(config) => {
            if (editingCard) {
              handleUpdateCard({ ...editingCard, ...config });
            } else {
              handleAddCard(config);
            }
          }}
          onClose={() => {
            setShowAddCard(false);
            setEditingCard(null);
          }}
        />
      )}
    </div>
  );
}

// Card Editor Modal Component
interface CardEditorModalProps {
  card?: QuickStatCardConfig | null;
  onSave: (config: Partial<QuickStatCardConfig>) => void;
  onClose: () => void;
}

const AVAILABLE_METRICS = [
  { value: 'morning_weight', label: 'Morning Weight', group: 'Body' },
  { value: 'weight', label: 'Weight (from stats)', group: 'Body' },
  { value: 'weight_vs_last_week_avg', label: 'Weight vs Last Week Avg', group: 'Body' },
  { value: 'calories', label: 'Calories', group: 'Nutrition' },
  { value: 'protein', label: 'Protein', group: 'Nutrition' },
  { value: 'complete_protein', label: 'Complete Protein', group: 'Nutrition' },
  { value: 'carbs', label: 'Carbs', group: 'Nutrition' },
  { value: 'fiber', label: 'Fiber', group: 'Nutrition' },
  { value: 'sugar', label: 'Sugar', group: 'Nutrition' },
  { value: 'added_sugar', label: 'Added Sugar', group: 'Nutrition' },
  { value: 'fat', label: 'Fat', group: 'Nutrition' },
  { value: 'saturated_fat', label: 'Saturated Fat', group: 'Nutrition' },
  { value: 'monounsaturated_fat', label: 'Monounsaturated Fat', group: 'Nutrition' },
  { value: 'polyunsaturated_fat', label: 'Polyunsaturated Fat', group: 'Nutrition' },
  { value: 'trans_fat', label: 'Trans Fat', group: 'Nutrition' },
  { value: 'cholesterol', label: 'Cholesterol', group: 'Nutrition' },
  { value: 'total_sets', label: 'Total Sets', group: 'Training' },
  { value: 'total_volume', label: 'Total Volume', group: 'Training' },
  { value: 'total_reps', label: 'Total Reps', group: 'Training' },
  { value: 'cardio_minutes', label: 'Cardio Minutes', group: 'Cardio' },
  { value: 'cardio_sessions', label: 'Cardio Sessions', group: 'Cardio' },
  { value: 'sleep_duration', label: 'Sleep Duration', group: 'Recovery' },
  { value: 'sleep_quality', label: 'Sleep Quality', group: 'Recovery' },
  { value: 'hydration_oz', label: 'Hydration (oz)', group: 'Recovery' },
  { value: 'supplement_count', label: 'Supplement Count', group: 'Supplements' },
  { value: 'alcohol_drinks', label: 'Alcohol Drinks', group: 'Other' },
  { value: 'stress_level', label: 'Stress Level', group: 'Other' },
];

const COMPARISON_PERIODS = [
  { value: 'yesterday', label: 'vs Yesterday' },
  { value: 'last_7_days', label: 'vs Last 7 Days Avg' },
  { value: 'last_14_days', label: 'vs Last 14 Days Avg' },
  { value: 'last_30_days', label: 'vs Last 30 Days Avg' },
];

const COLOR_OPTIONS = [
  { value: 'var(--text-primary)', label: 'White' },
  { value: 'var(--accent-primary)', label: 'Cyan' },
  { value: 'var(--accent-secondary)', label: 'Purple' },
  { value: 'var(--accent-success)', label: 'Green' },
  { value: 'var(--accent-warning)', label: 'Orange' },
  { value: 'var(--accent-danger)', label: 'Red' },
  { value: 'var(--text-secondary)', label: 'Gray' },
];

function CardEditorModal({ card, onSave, onClose }: CardEditorModalProps) {
  const [label, setLabel] = useState(card?.label || '');
  const [metric, setMetric] = useState(card?.metric || 'calories');
  const [displayMode, setDisplayMode] = useState(card?.displayMode || 'value');
  const [comparisonPeriod, setComparisonPeriod] = useState(card?.comparisonPeriod || 'last_7_days');
  const [color, setColor] = useState(card?.color || 'var(--text-primary)');
  const [unit, setUnit] = useState(card?.unit || '');

  // Auto-set label and unit when metric changes
  useEffect(() => {
    if (!card) {
      const metricInfo = AVAILABLE_METRICS.find(m => m.value === metric);
      if (metricInfo && !label) {
        setLabel(metricInfo.label);
      }
      setUnit(METRIC_UNITS[metric] || '');
      setColor(METRIC_COLORS[metric] || 'var(--text-primary)');
    }
  }, [metric, card, label]);

  const handleSave = () => {
    onSave({
      label: label || METRIC_LABELS[metric] || 'Stat',
      metric: metric as any,
      displayMode: displayMode as any,
      comparisonPeriod: displayMode === 'comparison' ? comparisonPeriod as any : undefined,
      color,
      unit,
    });
  };

  return (
    <div className="card-editor-overlay" onClick={onClose}>
      <div className="card-editor-modal" onClick={e => e.stopPropagation()}>
        <div className="card-editor-header">
          <h3>{card ? 'Edit Stat Card' : 'Add Stat Card'}</h3>
          <button className="card-editor-close" onClick={onClose}>×</button>
        </div>
        
        <div className="card-editor-body">
          <div className="card-editor-field">
            <label>Metric</label>
            <select 
              value={metric} 
              onChange={e => {
                setMetric(e.target.value);
                if (!card) setLabel(''); // Reset label to auto-fill
              }}
            >
              {Object.entries(
                AVAILABLE_METRICS.reduce((groups, m) => {
                  if (!groups[m.group]) groups[m.group] = [];
                  groups[m.group].push(m);
                  return groups;
                }, {} as Record<string, typeof AVAILABLE_METRICS>)
              ).map(([group, metrics]) => (
                <optgroup key={group} label={group}>
                  {metrics.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="card-editor-field">
            <label>Label</label>
            <input 
              type="text" 
              value={label} 
              onChange={e => setLabel(e.target.value)}
              placeholder="Card label"
            />
          </div>

          <div className="card-editor-field">
            <label>Display Mode</label>
            <div className="card-editor-radio-group">
              <label className={`radio-option ${displayMode === 'value' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  value="value" 
                  checked={displayMode === 'value'}
                  onChange={e => setDisplayMode(e.target.value as any)}
                />
                <span>Today's Value</span>
              </label>
              <label className={`radio-option ${displayMode === 'comparison' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  value="comparison" 
                  checked={displayMode === 'comparison'}
                  onChange={e => setDisplayMode(e.target.value as any)}
                />
                <span>Comparison</span>
              </label>
            </div>
          </div>

          {displayMode === 'comparison' && (
            <div className="card-editor-field">
              <label>Compare To</label>
              <select 
                value={comparisonPeriod} 
                onChange={e => setComparisonPeriod(e.target.value as any)}
              >
                {COMPARISON_PERIODS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="card-editor-field">
            <label>Color</label>
            <div className="color-picker">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c.value}
                  className={`color-option ${color === c.value ? 'selected' : ''}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="card-editor-field">
            <label>Unit (optional)</label>
            <input 
              type="text" 
              value={unit} 
              onChange={e => setUnit(e.target.value)}
              placeholder="e.g., lb, g, min"
            />
          </div>
        </div>

        <div className="card-editor-footer">
          <button className="card-editor-cancel" onClick={onClose}>Cancel</button>
          <button className="card-editor-save" onClick={handleSave}>
            {card ? 'Update' : 'Add'} Card
          </button>
        </div>
      </div>
    </div>
  );
}
