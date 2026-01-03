'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { logEntryApi } from '../../api';
import type { LogEntry } from '../../types';

interface WeightEntry {
  date: string;
  weight: number | undefined;
  logEntryId: number | null;
}

interface WeekGroup {
  weekStart: string;
  weekEnd: string;
  entries: WeightEntry[];
  average: number | null;
  change: number | null; // Change from previous week
  entryCount: number;
}

interface WeightManagerProps {
  onWeightUpdated?: () => void;
}

export default function WeightManager({ onWeightUpdated }: WeightManagerProps) {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Get the Sunday (week start) for a given date
  const getWeekStart = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const day = date.getDay(); // 0 = Sunday
    const diff = date.getDate() - day;
    const sunday = new Date(date);
    sunday.setDate(diff);
    return sunday.toISOString().split('T')[0];
  };

  // Get the Saturday (week end) for a given date
  const getWeekEnd = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const day = date.getDay();
    const diff = date.getDate() + (6 - day);
    const saturday = new Date(date);
    saturday.setDate(diff);
    return saturday.toISOString().split('T')[0];
  };

  // Format date for display (e.g., "Sat, Jan 3")
  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Format week range (e.g., "Dec 29 - Jan 4")
  const formatWeekRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr + 'T12:00:00');
    const end = new Date(endStr + 'T12:00:00');
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const startDay = start.getDate();
    const endDay = end.getDate();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  };

  // Get the last 6 weeks of dates
  const getLastNWeeks = (numWeeks: number) => {
    const days: string[] = [];
    const today = new Date();
    const daysToFetch = numWeeks * 7;
    for (let i = 0; i < daysToFetch; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const fetchWeights = useCallback(async () => {
    setLoading(true);
    try {
      const logEntries = await logEntryApi.getAll();
      const last6Weeks = getLastNWeeks(6);
      
      // Create a map of date -> log entry for quick lookup
      const entryMap = new Map<string, LogEntry>();
      logEntries.forEach(entry => {
        const entryDate = entry.timestamp.split('T')[0];
        entryMap.set(entryDate, entry);
      });

      // Build weight entries
      const entries: WeightEntry[] = last6Weeks.map(date => {
        const logEntry = entryMap.get(date);
        return {
          date,
          weight: logEntry?.morning_weight,
          logEntryId: logEntry?.id ?? null,
        };
      });

      setWeightEntries(entries);
    } catch (error) {
      console.error('Failed to fetch weight entries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeights();
  }, [fetchWeights]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingDate && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingDate]);

  // Group entries by week
  const weekGroups = useMemo(() => {
    const groups = new Map<string, WeightEntry[]>();
    
    weightEntries.forEach(entry => {
      const weekStart = getWeekStart(entry.date);
      if (!groups.has(weekStart)) {
        groups.set(weekStart, []);
      }
      groups.get(weekStart)!.push(entry);
    });

    // Convert to array and sort by week (most recent first)
    const sortedWeeks = Array.from(groups.entries())
      .sort((a, b) => b[0].localeCompare(a[0]));

    // Calculate averages for each week
    const weekGroupsWithStats: WeekGroup[] = sortedWeeks.map(([weekStart, entries], index) => {
      const weightsWithValues = entries.filter(e => e.weight != null);
      const average = weightsWithValues.length > 0
        ? weightsWithValues.reduce((sum, e) => sum + (e.weight || 0), 0) / weightsWithValues.length
        : null;

      // Sort entries within week (most recent first)
      const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));

      return {
        weekStart,
        weekEnd: getWeekEnd(weekStart),
        entries: sortedEntries,
        average,
        change: null, // Will be calculated after
        entryCount: weightsWithValues.length,
      };
    });

    // Calculate week-over-week changes
    for (let i = 0; i < weekGroupsWithStats.length - 1; i++) {
      const currentWeek = weekGroupsWithStats[i];
      const previousWeek = weekGroupsWithStats[i + 1];
      
      if (currentWeek.average != null && previousWeek.average != null) {
        currentWeek.change = currentWeek.average - previousWeek.average;
      }
    }

    return weekGroupsWithStats;
  }, [weightEntries]);

  const handleWeightClick = (entry: WeightEntry) => {
    setEditingDate(entry.date);
    setEditValue(entry.weight?.toString() ?? '');
  };

  const handleWeightChange = (value: string) => {
    setEditValue(value);
  };

  const saveWeight = async (date: string, weightValue: string) => {
    const weight = weightValue ? parseFloat(weightValue) : undefined;
    const entry = weightEntries.find(e => e.date === date);
    if (!entry) return;

    // Optimistically update local state
    setWeightEntries(prev => prev.map(e => 
      e.date === date ? { ...e, weight } : e
    ));

    try {
      const timestamp = `${date}T12:00:00`;
      
      if (entry.logEntryId) {
        // Update existing log entry
        await logEntryApi.update(entry.logEntryId, {
          timestamp,
          morning_weight: weight,
        });
      } else if (weight !== undefined) {
        // Create new log entry only if there's a weight value
        const created = await logEntryApi.create({
          timestamp,
          morning_weight: weight,
        });
        // Update local state with the new log entry id
        setWeightEntries(prev => prev.map(e => 
          e.date === date ? { ...e, logEntryId: created.id } : e
        ));
      }

      // Notify parent that weight was updated
      onWeightUpdated?.();
    } catch (error) {
      console.error('Failed to save weight:', error);
      // Revert on error
      fetchWeights();
    }
  };

  const handleWeightBlur = () => {
    if (editingDate) {
      saveWeight(editingDate, editValue);
      setEditingDate(null);
    }
  };

  const handleWeightKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleWeightBlur();
    } else if (e.key === 'Escape') {
      setEditingDate(null);
      setEditValue('');
    }
  };

  const getTodayString = () => new Date().toISOString().split('T')[0];
  const today = getTodayString();
  const currentWeekStart = getWeekStart(today);

  // Format change indicator
  const formatChange = (change: number | null) => {
    if (change == null) return null;
    const sign = change >= 0 ? '+' : '';
    const arrow = change > 0 ? '▲' : change < 0 ? '▼' : '';
    const colorClass = change > 0 ? 'weight-change-up' : change < 0 ? 'weight-change-down' : '';
    return (
      <span className={`weight-change ${colorClass}`}>
        {arrow} {sign}{change.toFixed(1)} lb
      </span>
    );
  };

  return (
    <div className="manager weight-manager">
      <div className="manager-header">
        <h1 className="manager-title">⚖️ Weight Tracker</h1>
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div className="weight-weeks-container">
          {weekGroups.map((week) => (
            <div 
              key={week.weekStart} 
              className={`weight-week-group ${week.weekStart === currentWeekStart ? 'current-week' : ''}`}
            >
              <div className="weight-week-header">
                <div className="weight-week-title">
                  <span className="weight-week-label">Week of</span>
                  <span className="weight-week-range">{formatWeekRange(week.weekStart, week.weekEnd)}</span>
                  {week.weekStart === currentWeekStart && (
                    <span className="weight-current-week-badge">Current</span>
                  )}
                </div>
                <div className="weight-week-stats">
                  {week.average != null ? (
                    <>
                      <span className="weight-week-avg">
                        Avg: <strong>{week.average.toFixed(1)} lb</strong>
                      </span>
                      {formatChange(week.change)}
                      <span className="weight-week-entries">
                        ({week.entryCount}/7 days)
                      </span>
                    </>
                  ) : (
                    <span className="weight-week-no-data">No data</span>
                  )}
                </div>
              </div>
              
              <div className="weight-week-entries-list">
                {week.entries.map((entry) => (
                  <div 
                    key={entry.date}
                    className={`weight-entry-row ${entry.date === today ? 'weight-entry-today' : ''}`}
                  >
                    <span className="weight-entry-date">
                      {formatDateShort(entry.date)}
                      {entry.date === today && (
                        <span className="weight-today-badge">Today</span>
                      )}
                    </span>
                    <span className="weight-entry-value">
                      {editingDate === entry.date ? (
                        <input
                          ref={inputRef}
                          type="number"
                          step="0.1"
                          className="weight-table-input"
                          value={editValue}
                          onChange={(e) => handleWeightChange(e.target.value)}
                          onBlur={handleWeightBlur}
                          onKeyDown={handleWeightKeyDown}
                        />
                      ) : (
                        <span 
                          className="weight-value-clickable"
                          onClick={() => handleWeightClick(entry)}
                          title="Click to edit"
                        >
                          {entry.weight != null ? `${entry.weight.toFixed(1)} lb` : '—'}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
