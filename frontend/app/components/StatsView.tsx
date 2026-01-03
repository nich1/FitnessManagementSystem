'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type {
  MetricType, DateRangeType, AggregationType, ChartType, TrainingFilterType, CardioFilterType,
  StatsQueryResponse, StatsConfiguration, StatsConfigurationRequest,
  Mesocycle, MetricData, Exercise, MovementPattern, Workout, Supplement, Compound
} from '../types';
import { statsApi, mesocycleApi, exerciseApi, movementPatternApi, workoutApi, supplementApi, compoundApi } from '../api';

// Metric categories for organization
const METRIC_CATEGORIES = {
  'Body': ['weight'],
  'Nutrition': ['calories', 'protein', 'complete_protein', 'carbs', 'fat', 'fiber', 'sugar'],
  'Training Overview': ['workout_count', 'total_sets', 'total_reps', 'total_volume'],
  'Cardio': ['cardio_minutes', 'cardio_sessions'],
  'Recovery': ['sleep_duration', 'sleep_quality', 'stress_level'],
  'Other': ['hydration_oz', 'supplement_count', 'alcohol_drinks'],
};

// Training comparison metrics (require filter selection)
const TRAINING_COMPARISON_METRICS = ['exercise_weight', 'exercise_reps', 'exercise_sets', 'exercise_volume'];

// Cardio comparison metrics
const CARDIO_COMPARISON_METRICS = ['cardio_duration', 'cardio_distance', 'cardio_speed', 'cardio_incline'];

// Cardio type labels
const CARDIO_TYPE_LABELS: Record<string, string> = {
  none: 'All Cardio',
  incline_walking: 'Incline Walking',
  sprints: 'Sprints',
  walking: 'Walking',
  running: 'Running',
  cycling: 'Cycling',
  swimming: 'Swimming',
  other: 'Other',
};

// Sleep metrics
const SLEEP_METRICS = ['sleep_duration', 'sleep_quality'];

// Hydration metrics
const HYDRATION_METRICS = ['hydration_oz', 'alcohol_drinks'];

// Supplement comparison metrics
const SUPPLEMENT_METRICS = ['supplement_servings', 'compound_amount'];

const METRIC_LABELS: Record<string, string> = {
  weight: 'Weight',
  calories: 'Calories',
  protein: 'Protein',
  complete_protein: 'Complete Protein',
  carbs: 'Carbohydrates',
  fat: 'Fat',
  fiber: 'Fiber',
  sugar: 'Sugar',
  workout_count: 'Workouts',
  total_sets: 'Total Sets',
  total_reps: 'Total Reps',
  total_volume: 'Total Volume',
  exercise_weight: 'Weight',
  exercise_reps: 'Reps',
  exercise_sets: 'Sets',
  exercise_volume: 'Volume',
  cardio_minutes: 'Cardio (min)',
  cardio_sessions: 'Cardio Sessions',
  sleep_duration: 'Sleep Duration',
  sleep_quality: 'Sleep Quality',
  stress_level: 'Stress Level',
  hydration_oz: 'Hydration (oz)',
  hydration_ml: 'Hydration (ml)',
  supplement_count: 'Supplements',
  alcohol_drinks: 'Alcohol',
  cardio_duration: 'Duration',
  cardio_distance: 'Distance',
  cardio_speed: 'Speed',
  cardio_incline: 'Incline',
  supplement_servings: 'Servings',
  compound_amount: 'Amount',
};

const DATE_RANGE_OPTIONS: { value: DateRangeType; label: string }[] = [
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'all_time', label: 'All Time' },
  { value: 'mesocycle', label: 'By Mesocycle' },
  { value: 'custom', label: 'Custom Range' },
];

const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c43', '#a4de6c',
  '#d0ed57', '#83a6ed', '#8dd1e1', '#a4a4a4', '#ffb347'
];

export default function StatsView() {
  // Query state
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>(['weight']);
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('last_30_days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mesocycleId, setMesocycleId] = useState<number | null>(null);
  const [aggregation, setAggregation] = useState<AggregationType>('daily');
  const [chartType, setChartType] = useState<ChartType>('area');
  
  // Training comparison state
  const [trainingFilterType, setTrainingFilterType] = useState<TrainingFilterType>('none');
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [selectedMovementPatternId, setSelectedMovementPatternId] = useState<number | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
  const [selectedTrainingMesocycleId, setSelectedTrainingMesocycleId] = useState<number | null>(null);
  const [trainingMetrics, setTrainingMetrics] = useState<MetricType[]>([]);
  
  // Cardio comparison state
  const [cardioFilterType, setCardioFilterType] = useState<CardioFilterType>('none');
  const [cardioMetrics, setCardioMetrics] = useState<MetricType[]>([]);
  
  // Sleep comparison state
  const [sleepMetrics, setSleepMetrics] = useState<MetricType[]>([]);
  
  // Hydration comparison state
  const [hydrationMetrics, setHydrationMetrics] = useState<MetricType[]>([]);
  
  // Supplement comparison state
  const [selectedSupplementIds, setSelectedSupplementIds] = useState<number[]>([]);
  const [selectedCompoundIds, setSelectedCompoundIds] = useState<number[]>([]);
  const [supplementComparisonMetrics, setSupplementComparisonMetrics] = useState<MetricType[]>([]);
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    generalMetrics: true,
    trainingComparison: true,
    cardioComparison: true,
    sleep: true,
    hydration: true,
    supplements: true,
  });
  
  // Data state
  const [queryResult, setQueryResult] = useState<StatsQueryResponse | null>(null);
  const [mesocycles, setMesocycles] = useState<Mesocycle[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [movementPatterns, setMovementPatterns] = useState<MovementPattern[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [compounds, setCompounds] = useState<Compound[]>([]);
  const [configurations, setConfigurations] = useState<StatsConfiguration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Save configuration modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [configName, setConfigName] = useState('');
  const [configDescription, setConfigDescription] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [mesocyclesData, configsData, exercisesData, patternsData, workoutsData, supplementsData, compoundsData] = await Promise.all([
        mesocycleApi.getAll().catch(() => []),
        statsApi.getConfigurations().catch(() => []),
        exerciseApi.getAll().catch(() => []),
        movementPatternApi.getAll().catch(() => []),
        workoutApi.getAll().catch(() => []),
        supplementApi.getAll().catch(() => []),
        compoundApi.getAll().catch(() => []),
      ]);
      setMesocycles(mesocyclesData);
      setConfigurations(configsData);
      setExercises(exercisesData);
      setMovementPatterns(patternsData);
      setWorkouts(workoutsData);
      setSupplements(supplementsData);
      setCompounds(compoundsData);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const runQuery = async () => {
    const allMetrics = [...selectedMetrics, ...trainingMetrics, ...cardioMetrics, ...sleepMetrics, ...hydrationMetrics, ...supplementComparisonMetrics];
    if (allMetrics.length === 0) {
      setError('Please select at least one metric');
      return;
    }

    // Validate training filter if training metrics are selected
    if (trainingMetrics.length > 0 && trainingFilterType === 'none') {
      setError('Please select a training filter (exercise, movement pattern, workout, or mesocycle)');
      return;
    }
    
    // Validate supplement/compound selection if supplement metrics are selected
    if (supplementComparisonMetrics.includes('supplement_servings' as MetricType) && selectedSupplementIds.length === 0) {
      setError('Please select at least one supplement to track');
      return;
    }
    if (supplementComparisonMetrics.includes('compound_amount' as MetricType) && selectedCompoundIds.length === 0) {
      setError('Please select at least one compound to track');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await statsApi.query({
        metrics: allMetrics,
        date_range_type: dateRangeType,
        start_date: dateRangeType === 'custom' ? startDate : undefined,
        end_date: dateRangeType === 'custom' ? endDate : undefined,
        mesocycle_id: dateRangeType === 'mesocycle' ? mesocycleId ?? undefined : undefined,
        aggregation,
        training_filter_type: trainingFilterType,
        exercise_id: selectedExerciseId ?? undefined,
        movement_pattern_id: selectedMovementPatternId ?? undefined,
        workout_id: selectedWorkoutId ?? undefined,
        training_mesocycle_id: selectedTrainingMesocycleId ?? undefined,
        cardio_filter_type: cardioFilterType,
        supplement_ids: selectedSupplementIds.length > 0 ? selectedSupplementIds : undefined,
        compound_ids: selectedCompoundIds.length > 0 ? selectedCompoundIds : undefined,
      });
      setQueryResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const toggleTrainingMetric = (metric: MetricType) => {
    setTrainingMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const handleTrainingFilterChange = (filterType: TrainingFilterType) => {
    setTrainingFilterType(filterType);
    // Reset selections when changing filter type
    setSelectedExerciseId(null);
    setSelectedMovementPatternId(null);
    setSelectedWorkoutId(null);
    setSelectedTrainingMesocycleId(null);
  };

  const toggleCardioMetric = (metric: MetricType) => {
    setCardioMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const toggleSleepMetric = (metric: MetricType) => {
    setSleepMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const toggleHydrationMetric = (metric: MetricType) => {
    setHydrationMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const toggleSupplementMetric = (metric: MetricType) => {
    setSupplementComparisonMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const toggleSupplementSelection = (id: number) => {
    setSelectedSupplementIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleCompoundSelection = (id: number) => {
    setSelectedCompoundIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleMetric = (metric: MetricType) => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const saveConfiguration = async () => {
    if (!configName.trim()) return;

    try {
      const newConfig = await statsApi.createConfiguration({
        name: configName,
        description: configDescription || undefined,
        config: {
          metrics: selectedMetrics,
          date_range_type: dateRangeType,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          mesocycle_id: mesocycleId ?? undefined,
          aggregation,
          chart_type: chartType,
        },
      });
      setConfigurations([...configurations, newConfig]);
      setShowSaveModal(false);
      setConfigName('');
      setConfigDescription('');
    } catch (err) {
      console.error('Failed to save configuration:', err);
    }
  };

  const loadConfiguration = (config: StatsConfiguration) => {
    setSelectedMetrics(config.config.metrics);
    setDateRangeType(config.config.date_range_type);
    setStartDate(config.config.start_date || '');
    setEndDate(config.config.end_date || '');
    setMesocycleId(config.config.mesocycle_id ?? null);
    setAggregation(config.config.aggregation);
    setChartType(config.config.chart_type);
  };

  const deleteConfiguration = async (id: number) => {
    try {
      await statsApi.deleteConfiguration(id);
      setConfigurations(configurations.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to delete configuration:', err);
    }
  };

  // Prepare chart data
  const getChartData = () => {
    if (!queryResult) return [];

    // Get all unique dates
    const allDates = new Set<string>();
    queryResult.metrics.forEach(m => {
      m.data.forEach(d => allDates.add(d.date));
    });

    // Create data points for each date
    return Array.from(allDates).sort().map(date => {
      const point: Record<string, any> = { date };
      queryResult.metrics.forEach(m => {
        const dataPoint = m.data.find(d => d.date === date);
        point[m.metric] = dataPoint?.value ?? null;
      });
      return point;
    });
  };

  const renderChart = () => {
    if (!queryResult || queryResult.metrics.length === 0) return null;

    const data = getChartData();
    const ChartComponent = chartType === 'bar' ? BarChart : chartType === 'area' ? AreaChart : LineChart;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DataComponent: any = chartType === 'bar' ? Bar : chartType === 'area' ? Area : Line;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ChartComponent data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis 
            dataKey="date" 
            stroke="var(--text-muted)"
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          />
          <YAxis 
            stroke="var(--text-muted)"
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--surface-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'var(--text-primary)' }}
          />
          <Legend />
          {queryResult.metrics.map((metric, index) => (
            <DataComponent
              key={metric.metric}
              type="monotone"
              dataKey={metric.metric}
              name={`${metric.label} (${metric.unit})`}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              fill={chartType === 'area' ? CHART_COLORS[index % CHART_COLORS.length] : undefined}
              fillOpacity={chartType === 'area' ? 0.3 : undefined}
              dot={chartType === 'line' ? { r: 3 } : undefined}
              connectNulls
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  // Helper to format minutes as hours and minutes
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Format stat value based on metric type
  const formatStatValue = (value: number, metric: string, unit: string): string => {
    if (metric === 'sleep_duration') {
      return formatDuration(value);
    }
    return `${value.toFixed(1)} ${unit}`;
  };

  const renderStats = (metric: MetricData) => (
    <div key={metric.metric} className="stats-metric-summary">
      <h4>{metric.label}</h4>
      <div className="stats-values">
        {metric.average !== null && (
          <div className="stat-item">
            <span className="stat-label">Avg</span>
            <span className="stat-value">{formatStatValue(metric.average, metric.metric, metric.unit)}</span>
          </div>
        )}
        {metric.min_value !== null && (
          <div className="stat-item">
            <span className="stat-label">Min</span>
            <span className="stat-value">{formatStatValue(metric.min_value, metric.metric, metric.unit)}</span>
          </div>
        )}
        {metric.max_value !== null && (
          <div className="stat-item">
            <span className="stat-label">Max</span>
            <span className="stat-value">{formatStatValue(metric.max_value, metric.metric, metric.unit)}</span>
          </div>
        )}
        {metric.total !== null && (
          <div className="stat-item">
            <span className="stat-label">Total</span>
            <span className="stat-value">{formatStatValue(metric.total, metric.metric, metric.unit)}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="stats-view">
      <div className="stats-header">
        <h1>📊 Statistics</h1>
        <p>Analyze your fitness data over time</p>
      </div>

      {/* Top Controls Row - Date Range, Aggregation, Chart Type */}
      <div className="stats-controls-row">
        <div className="stats-control-group">
          <label>Date Range</label>
          <select
            className="form-select"
            value={dateRangeType}
            onChange={e => setDateRangeType(e.target.value as DateRangeType)}
          >
            {DATE_RANGE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {dateRangeType === 'custom' && (
            <div className="date-inputs-inline">
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <span>to</span>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          )}
          {dateRangeType === 'mesocycle' && (
            <select
              className="form-select"
              value={mesocycleId || ''}
              onChange={e => setMesocycleId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Select mesocycle...</option>
              {mesocycles.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="stats-control-group">
          <label>Aggregation</label>
          <div className="btn-group">
            {(['daily', 'weekly', 'monthly'] as AggregationType[]).map(agg => (
              <button
                key={agg}
                className={`btn-toggle ${aggregation === agg ? 'active' : ''}`}
                onClick={() => setAggregation(agg)}
              >
                {agg.charAt(0).toUpperCase() + agg.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="stats-control-group">
          <label>Chart Type</label>
          <div className="btn-group">
            {(['area', 'line', 'bar'] as ChartType[]).map(type => (
              <button
                key={type}
                className={`btn-toggle ${chartType === type ? 'active' : ''}`}
                onClick={() => setChartType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="stats-control-group stats-control-actions">
          <button
            className="btn btn-primary"
            onClick={runQuery}
            disabled={loading || (selectedMetrics.length === 0 && trainingMetrics.length === 0 && cardioMetrics.length === 0 && sleepMetrics.length === 0 && hydrationMetrics.length === 0 && supplementComparisonMetrics.length === 0)}
          >
            {loading ? 'Loading...' : 'Run Query'}
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="stats-chart-area">
        {error && (
          <div className="stats-error">{error}</div>
        )}

        {queryResult && (
          <>
            <div className="stats-chart-container">
              <div className="chart-header">
                <span className="date-range">
                  {queryResult.start_date} to {queryResult.end_date}
                </span>
              </div>
              {renderChart()}
            </div>

            <div className="stats-summaries">
              {queryResult.metrics.map(renderStats)}
            </div>
          </>
        )}

        {!queryResult && !loading && (
          <div className="stats-empty">
            <span className="stats-empty-icon">📈</span>
            <h3>Select metrics and run a query</h3>
            <p>Choose the data you want to analyze below, then click "Run Query" to see your results.</p>
          </div>
        )}
      </div>

      <div className="stats-layout">
        {/* Sidebar - Controls */}
        <div className="stats-sidebar">
          {/* Saved Configurations */}
          {configurations.length > 0 && (
            <div className="stats-section">
              <h3>Saved Views</h3>
              <div className="saved-configs-list">
                {configurations.map(config => (
                  <div key={config.id} className="saved-config-item">
                    <button
                      className="config-load-btn"
                      onClick={() => loadConfiguration(config)}
                    >
                      {config.name}
                    </button>
                    <button
                      className="config-delete-btn"
                      onClick={() => deleteConfiguration(config.id)}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics Selection */}
          <div className="stats-section collapsible">
            <h3 className="section-header" onClick={() => toggleSection('generalMetrics')}>
              <span className={`collapse-icon ${expandedSections.generalMetrics ? 'expanded' : ''}`}>▶</span>
              General Metrics
            </h3>
            {expandedSections.generalMetrics && Object.entries(METRIC_CATEGORIES).map(([category, categoryMetrics]) => (
              <div key={category} className="metric-category">
                <h4>{category}</h4>
                <div className="metric-options">
                  {categoryMetrics.map(metric => (
                    <label key={metric} className="metric-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedMetrics.includes(metric as MetricType)}
                        onChange={() => toggleMetric(metric as MetricType)}
                      />
                      <span>{METRIC_LABELS[metric] || metric}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Training Comparison */}
          <div className="stats-section collapsible">
            <h3 className="section-header" onClick={() => toggleSection('trainingComparison')}>
              <span className={`collapse-icon ${expandedSections.trainingComparison ? 'expanded' : ''}`}>▶</span>
              Training Comparison
            </h3>
            {expandedSections.trainingComparison && (
            <>
            <p className="stats-hint">Compare performance across specific exercises, movements, or workouts</p>
            
            <div className="training-filter-select">
              <label>Filter By</label>
              <select
                value={trainingFilterType}
                onChange={(e) => handleTrainingFilterChange(e.target.value as TrainingFilterType)}
              >
                <option value="none">None (disabled)</option>
                <option value="exercise">Exercise</option>
                <option value="movement_pattern">Movement Pattern</option>
                <option value="workout">Workout</option>
                <option value="mesocycle">Mesocycle</option>
              </select>
            </div>

            {trainingFilterType === 'exercise' && (
              <div className="training-filter-select">
                <label>Select Exercise</label>
                <select
                  value={selectedExerciseId || ''}
                  onChange={(e) => setSelectedExerciseId(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Choose an exercise...</option>
                  {exercises.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </div>
            )}

            {trainingFilterType === 'movement_pattern' && (
              <div className="training-filter-select">
                <label>Select Movement Pattern</label>
                <select
                  value={selectedMovementPatternId || ''}
                  onChange={(e) => setSelectedMovementPatternId(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Choose a pattern...</option>
                  {movementPatterns.map(mp => (
                    <option key={mp.id} value={mp.id}>{mp.name}</option>
                  ))}
                </select>
              </div>
            )}

            {trainingFilterType === 'workout' && (
              <div className="training-filter-select">
                <label>Select Workout</label>
                <select
                  value={selectedWorkoutId || ''}
                  onChange={(e) => setSelectedWorkoutId(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Choose a workout...</option>
                  {workouts.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            )}

            {trainingFilterType === 'mesocycle' && (
              <div className="training-filter-select">
                <label>Select Mesocycle</label>
                <select
                  value={selectedTrainingMesocycleId || ''}
                  onChange={(e) => setSelectedTrainingMesocycleId(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Choose a mesocycle...</option>
                  {mesocycles.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            {trainingFilterType !== 'none' && (
              <div className="metric-category">
                <h4>Training Metrics</h4>
                <div className="metric-options">
                  {TRAINING_COMPARISON_METRICS.map(metric => (
                    <label key={metric} className="metric-checkbox">
                      <input
                        type="checkbox"
                        checked={trainingMetrics.includes(metric as MetricType)}
                        onChange={() => toggleTrainingMetric(metric as MetricType)}
                      />
                      <span>{METRIC_LABELS[metric] || metric}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            </>
            )}
          </div>

          {/* Cardio Comparison */}
          <div className="stats-section collapsible">
            <h3 className="section-header" onClick={() => toggleSection('cardioComparison')}>
              <span className={`collapse-icon ${expandedSections.cardioComparison ? 'expanded' : ''}`}>▶</span>
              Cardio Comparison
            </h3>
            {expandedSections.cardioComparison && (
            <>
            <p className="stats-hint">Compare cardio performance by type or across all cardio</p>
            
            <div className="training-filter-select">
              <label>Filter By Type</label>
              <select
                value={cardioFilterType}
                onChange={(e) => setCardioFilterType(e.target.value as CardioFilterType)}
              >
                {Object.entries(CARDIO_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="metric-category">
              <h4>Cardio Metrics</h4>
              <div className="metric-options">
                {CARDIO_COMPARISON_METRICS.map(metric => (
                  <label key={metric} className="metric-checkbox">
                    <input
                      type="checkbox"
                      checked={cardioMetrics.includes(metric as MetricType)}
                      onChange={() => toggleCardioMetric(metric as MetricType)}
                    />
                    <span>{METRIC_LABELS[metric] || metric}</span>
                  </label>
                ))}
              </div>
            </div>
            </>
            )}
          </div>

          {/* Sleep Comparison */}
          <div className="stats-section collapsible">
            <h3 className="section-header" onClick={() => toggleSection('sleep')}>
              <span className={`collapse-icon ${expandedSections.sleep ? 'expanded' : ''}`}>▶</span>
              Sleep
            </h3>
            {expandedSections.sleep && (
            <div className="metric-category">
              <div className="metric-options">
                {SLEEP_METRICS.map(metric => (
                  <label key={metric} className="metric-checkbox">
                    <input
                      type="checkbox"
                      checked={sleepMetrics.includes(metric as MetricType)}
                      onChange={() => toggleSleepMetric(metric as MetricType)}
                    />
                    <span>{METRIC_LABELS[metric] || metric}</span>
                  </label>
                ))}
              </div>
            </div>
            )}
          </div>

          {/* Hydration Comparison */}
          <div className="stats-section collapsible">
            <h3 className="section-header" onClick={() => toggleSection('hydration')}>
              <span className={`collapse-icon ${expandedSections.hydration ? 'expanded' : ''}`}>▶</span>
              Hydration
            </h3>
            {expandedSections.hydration && (
            <div className="metric-category">
              <div className="metric-options">
                {HYDRATION_METRICS.map(metric => (
                  <label key={metric} className="metric-checkbox">
                    <input
                      type="checkbox"
                      checked={hydrationMetrics.includes(metric as MetricType)}
                      onChange={() => toggleHydrationMetric(metric as MetricType)}
                    />
                    <span>{METRIC_LABELS[metric] || metric}</span>
                  </label>
                ))}
              </div>
            </div>
            )}
          </div>

          {/* Supplements Comparison */}
          <div className="stats-section collapsible">
            <h3 className="section-header" onClick={() => toggleSection('supplements')}>
              <span className={`collapse-icon ${expandedSections.supplements ? 'expanded' : ''}`}>▶</span>
              Supplements
            </h3>
            {expandedSections.supplements && (
            <>
            <p className="stats-hint">Track specific supplements or compounds over time</p>
            
            <div className="metric-category">
              <h4>Track By</h4>
              <div className="metric-options">
                <label className="metric-checkbox">
                  <input
                    type="checkbox"
                    checked={supplementComparisonMetrics.includes('supplement_servings' as MetricType)}
                    onChange={() => toggleSupplementMetric('supplement_servings' as MetricType)}
                  />
                  <span>Supplement Servings</span>
                </label>
                <label className="metric-checkbox">
                  <input
                    type="checkbox"
                    checked={supplementComparisonMetrics.includes('compound_amount' as MetricType)}
                    onChange={() => toggleSupplementMetric('compound_amount' as MetricType)}
                  />
                  <span>Compound Amount</span>
                </label>
              </div>
            </div>

            {supplementComparisonMetrics.includes('supplement_servings' as MetricType) && (
              <div className="supplement-selector">
                <h4>Select Supplements</h4>
                <div className="supplement-list">
                  {supplements.map(supp => (
                    <label key={supp.id} className="metric-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedSupplementIds.includes(supp.id)}
                        onChange={() => toggleSupplementSelection(supp.id)}
                      />
                      <span>{supp.brand} {supp.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {supplementComparisonMetrics.includes('compound_amount' as MetricType) && (
              <div className="compound-selector">
                <h4>Select Compounds</h4>
                <div className="compound-list">
                  {compounds.map(comp => (
                    <label key={comp.id} className="metric-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedCompoundIds.includes(comp.id)}
                        onChange={() => toggleCompoundSelection(comp.id)}
                      />
                      <span>{comp.name} ({comp.unit})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            </>
            )}
          </div>

          {/* Save View */}
          <div className="stats-section">
            <button
              className="btn btn-secondary btn-full"
              onClick={() => setShowSaveModal(true)}
            >
              💾 Save Current View
            </button>
          </div>
        </div>
      </div>

      {/* Save Configuration Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Save Configuration</h2>
              <button className="modal-close" onClick={() => setShowSaveModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={configName}
                  onChange={e => setConfigName(e.target.value)}
                  placeholder="e.g., Weekly Weight Trend"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea
                  className="form-textarea"
                  value={configDescription}
                  onChange={e => setConfigDescription(e.target.value)}
                  placeholder="What this view shows..."
                  rows={2}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSaveModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={saveConfiguration}
                disabled={!configName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

