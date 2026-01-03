'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { LogEntry, LogEntryRequest, Exercise } from './types';
import { logEntryApi, activityApi, exerciseApi } from './api';
import Sidebar, { View } from './components/Sidebar';
import DaySelector from './components/DaySelector';
import QuickStats from './components/QuickStats';
import SleepSection from './components/SleepSection';
import FoodsSection from './components/FoodsSection';
import ActivitiesSection from './components/WorkoutsSection';
import CardioSection from './components/CardioSection';
import ProgressPicturesSection from './components/ProgressPicturesSection';
import StressSection from './components/StressSection';
import HydrationSection from './components/HydrationSection';
import SupplementsSection from './components/SupplementsSection';
import Modal from './components/Modal';
import SleepForm, { SleepFormData } from './components/forms/SleepForm';
import AddFoodForm from './components/forms/AddFoodForm';
import WorkoutForm, { WorkoutFormData } from './components/forms/WorkoutForm';
import CardioForm, { CardioFormData } from './components/forms/CardioForm';
import StressForm, { StressFormData } from './components/forms/StressForm';
import HydrationForm, { HydrationFormData } from './components/forms/HydrationForm';
import SupplementForm, { SupplementFormData } from './components/forms/SupplementForm';
import QuickStatsForm, { QuickStatsFormData, setDefaultPhaseId, getDefaultPhaseId } from './components/forms/QuickStatsForm';
import FoodsManager from './components/managers/FoodsManager';
import MealsManager from './components/managers/MealsManager';
import ExercisesManager from './components/managers/ExercisesManager';
import MovementPatternsManager from './components/managers/MovementPatternsManager';
import WorkoutsManager from './components/managers/WorkoutsManager';
import CupsManager from './components/managers/CupsManager';
import SupplementsManager from './components/managers/SupplementsManager';
import CompoundsManager from './components/managers/CompoundsManager';
import CarbCycleManager from './components/managers/CarbCycleManager';
import MesocycleManager from './components/managers/MesocycleManager';
import SupplementCycleManager from './components/managers/SupplementCycleManager';
import StatsView from './components/StatsView';
import WeightManager from './components/managers/WeightManager';
import { useConfirmDialog } from './components/ConfirmDialog';

type ModalType = 'sleep' | 'food' | 'workout' | 'cardio' | 'stress' | 'hydration' | 'supplement' | 'quickstats' | 'addExercise' | null;

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('daily');
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [logEntry, setLogEntry] = useState<LogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [addExerciseToActivityId, setAddExerciseToActivityId] = useState<number | null>(null);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');

  const formatDateForApi = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const fetchLogEntry = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const dateStr = formatDateForApi(date);
      const entry = await logEntryApi.getByDate(dateStr);
      setLogEntry(entry);
      setApiConnected(true);
    } catch (error) {
      console.error('Failed to fetch log entry:', error);
      setLogEntry(null);
      setApiConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentView === 'daily') {
      fetchLogEntry(selectedDate);
    }
  }, [selectedDate, fetchLogEntry, currentView]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const closeModal = () => setActiveModal(null);

  const createOrUpdateLogEntry = async (updates: Partial<LogEntryRequest>, skipRefetch = false) => {
    const dateStr = formatDateForApi(selectedDate);
    const timestamp = `${dateStr}T12:00:00`;

    try {
      if (logEntry) {
        // Update existing entry - merge with existing data
        const updateData: LogEntryRequest = {
          timestamp: logEntry.timestamp,
          phase: updates.phase || (logEntry.phase ? { type: 'existing', id: logEntry.phase.id } : undefined),
          morning_weight: updates.morning_weight ?? logEntry.morning_weight,
          sleep: updates.sleep || (logEntry.sleep ? { type: 'existing', id: logEntry.sleep.id } : undefined),
          hydration: updates.hydration || logEntry.hydration?.map(h => ({ type: 'existing' as const, id: h.id })),
          foods: updates.foods || logEntry.foods?.map(f => ({ food_id: f.food.id, servings: f.servings })),
          activities: updates.activities || logEntry.activities?.map(a => ({ type: 'existing' as const, id: a.id })),
          cardio: updates.cardio || logEntry.cardio?.map(c => ({ type: 'existing' as const, id: c.id })),
          supplements: updates.supplements || logEntry.supplements?.map(s => ({ type: 'existing' as const, id: s.supplement.id, servings: s.servings })),
          stress: updates.stress || (logEntry.stress ? { type: 'existing', id: logEntry.stress.id } : undefined),
          num_standard_drinks: updates.num_standard_drinks ?? logEntry.num_standard_drinks,
          notes: updates.notes ?? logEntry.notes,
          carb_cycle_day_id: 'carb_cycle_day_id' in updates ? updates.carb_cycle_day_id : logEntry.carb_cycle?.selected_day.id,
        };
        await logEntryApi.update(logEntry.id, updateData);
      } else {
        // Create new entry
        // Apply default phase if no phase is specified
        let phaseToUse = updates.phase;
        if (!phaseToUse) {
          const defaultPhaseId = getDefaultPhaseId();
          if (defaultPhaseId) {
            phaseToUse = { type: 'existing', id: defaultPhaseId };
          }
        }
        
        const createData: LogEntryRequest = {
          timestamp,
          ...updates,
          phase: phaseToUse,
        };
        await logEntryApi.create(createData);
      }
      if (!skipRefetch) {
        await fetchLogEntry(selectedDate);
      }
    } catch (error) {
      console.error('Failed to save log entry:', error);
    }
  };

  // Ensure a log entry exists for the current date and return its ID
  const ensureLogEntry = async (): Promise<number | undefined> => {
    // If we already have the log entry in state, return its ID
    if (logEntry) {
      console.log('ensureLogEntry: using existing logEntry', logEntry.id);
      return logEntry.id;
    }
    
    const dateStr = formatDateForApi(selectedDate);
    const timestamp = `${dateStr}T12:00:00`;
    console.log('ensureLogEntry: no logEntry in state, checking date:', dateStr);
    
    // First check if one already exists (might not be loaded yet)
    try {
      console.log('ensureLogEntry: calling getByDate...');
      const existing = await logEntryApi.getByDate(dateStr);
      console.log('ensureLogEntry: getByDate returned:', existing);
      if (existing) {
        setLogEntry(existing);
        return existing.id;
      }
    } catch (e) {
      console.log('ensureLogEntry: getByDate threw (expected for 404):', e);
      // 404 is expected if no entry exists, continue to create one
    }
    
    // Create a new one
    try {
      console.log('ensureLogEntry: creating new entry with timestamp:', timestamp);
      const created = await logEntryApi.create({ timestamp });
      console.log('ensureLogEntry: create returned:', created);
      if (created && created.id) {
        setLogEntry(created);
        return created.id;
      }
      
      console.error('Created log entry but no ID returned:', created);
      return undefined;
    } catch (error) {
      console.error('Failed to create log entry:', error);
      return undefined;
    }
  };

  const handleSleepSubmit = async (data: SleepFormData) => {
    await createOrUpdateLogEntry({
      sleep: {
        type: 'new',
        date: data.date,
        duration: data.duration,
        quality: data.quality,
        notes: data.notes,
        naps: data.naps,
      },
    });
    closeModal();
  };

  const handleAddFoodSubmit = async (foods: { food_id: number; servings: number }[]) => {
    try {
      // Get existing foods and add new ones
      const existingFoods = logEntry?.foods?.map(f => ({ food_id: f.food.id, servings: f.servings })) || [];
      await createOrUpdateLogEntry({
        foods: [...existingFoods, ...foods],
      });
      closeModal();
    } catch (error) {
      console.error('Failed to add food:', error);
      alert('Failed to add food. Check console for details.');
    }
  };

  const handleActivitySubmit = async (data: WorkoutFormData) => {
    const existingActivities = logEntry?.activities?.map(a => ({ type: 'existing' as const, id: a.id })) || [];
    await createOrUpdateLogEntry({
      activities: [
        ...existingActivities,
        { type: 'new', workout_id: data.workout_id, time: data.time, notes: data.notes, exercises: data.exercises },
      ],
    });
    closeModal();
  };

  const handleActivityDelete = async (activityIndex: number) => {
    if (!logEntry || !logEntry.activities) return;
    
    const confirmed = await confirm({
      title: 'Remove Workout',
      message: 'Are you sure you want to remove this workout from today\'s log?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      const remainingActivities = logEntry.activities.filter((_, idx) => idx !== activityIndex);
      await createOrUpdateLogEntry({
        activities: remainingActivities.map(a => ({ type: 'existing' as const, id: a.id })),
      });
    } catch (error) {
      console.error('Failed to remove activity:', error);
    }
  };

  // Debounce timer for activity set changes
  const activitySaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingActivityUpdateRef = useRef<{ activityId: number; payload: any } | null>(null);

  const handleActivitySetChange = (
    activityId: number,
    exerciseId: number,
    setId: number,
    field: 'reps' | 'weight' | 'rir',
    value: number | undefined
  ) => {
    if (!logEntry?.activities) return;

    // Optimistically update local state immediately
    const updatedActivities = logEntry.activities.map((activity) => {
      if (activity.id !== activityId) return activity;
      const updatedExercises = activity.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const updatedSets = ex.sets.map((set) =>
          set.id === setId ? { ...set, [field]: value ?? 0 } : set
        );
        return { ...ex, sets: updatedSets };
      });
      return { ...activity, exercises: updatedExercises };
    });
    setLogEntry({ ...logEntry, activities: updatedActivities });

    const updatedActivity = updatedActivities.find((a) => a.id === activityId);
    if (!updatedActivity) return;

    const payload = {
      workout_id: updatedActivity.workout_id,
      time: updatedActivity.time,
      notes: updatedActivity.notes,
      exercises: updatedActivity.exercises.map((ex) => ({
        exercise_id: ex.exercise.id,
        session_notes: ex.session_notes,
        sets: ex.sets.map((s) => ({
          reps: s.reps,
          weight: s.weight,
          unit: s.unit,
          rir: s.rir,
          notes: s.notes,
        })),
      })),
    };

    // Store the pending update
    pendingActivityUpdateRef.current = { activityId, payload };

    // Clear existing timer and set a new one (debounce)
    if (activitySaveTimerRef.current) {
      clearTimeout(activitySaveTimerRef.current);
    }

    // Save after 500ms of no changes
    activitySaveTimerRef.current = setTimeout(async () => {
      const pending = pendingActivityUpdateRef.current;
      if (!pending) return;
      
      try {
        await activityApi.update(pending.activityId, pending.payload);
        // Don't refetch - we already updated optimistically
      } catch (error) {
        console.error('Failed to update activity set:', error);
        // On error, refetch to get correct state
        fetchLogEntry(selectedDate);
      }
      pendingActivityUpdateRef.current = null;
    }, 500);
  };

  const handleActivityExerciseReorder = (
    activityId: number,
    fromIndex: number,
    toIndex: number
  ) => {
    if (!logEntry?.activities) return;

    // Optimistically update local state immediately
    const updatedActivities = logEntry.activities.map((activity) => {
      if (activity.id !== activityId) return activity;
      const newExercises = [...activity.exercises];
      const [movedExercise] = newExercises.splice(fromIndex, 1);
      newExercises.splice(toIndex, 0, movedExercise);
      return { ...activity, exercises: newExercises };
    });
    setLogEntry({ ...logEntry, activities: updatedActivities });

    const updatedActivity = updatedActivities.find((a) => a.id === activityId);
    if (!updatedActivity) return;

    const payload = {
      workout_id: updatedActivity.workout_id,
      time: updatedActivity.time,
      notes: updatedActivity.notes,
      exercises: updatedActivity.exercises.map((ex) => ({
        exercise_id: ex.exercise.id,
        session_notes: ex.session_notes,
        sets: ex.sets.map((s) => ({
          reps: s.reps,
          weight: s.weight,
          unit: s.unit,
          rir: s.rir,
          notes: s.notes,
        })),
      })),
    };

    // Store the pending update
    pendingActivityUpdateRef.current = { activityId, payload };

    // Clear existing timer and set a new one (debounce)
    if (activitySaveTimerRef.current) {
      clearTimeout(activitySaveTimerRef.current);
    }

    // Save after 300ms (faster for drag operations)
    activitySaveTimerRef.current = setTimeout(async () => {
      const pending = pendingActivityUpdateRef.current;
      if (!pending) return;
      
      try {
        await activityApi.update(pending.activityId, pending.payload);
      } catch (error) {
        console.error('Failed to reorder exercises:', error);
        fetchLogEntry(selectedDate);
      }
      pendingActivityUpdateRef.current = null;
    }, 300);
  };

  const handleActivityTimeChange = async (activityId: number, newTime: string) => {
    if (!logEntry?.activities) return;

    // Optimistically update local state immediately
    const updatedActivities = logEntry.activities.map((activity) => {
      if (activity.id !== activityId) return activity;
      return { ...activity, time: newTime };
    });
    setLogEntry({ ...logEntry, activities: updatedActivities });

    const updatedActivity = updatedActivities.find((a) => a.id === activityId);
    if (!updatedActivity) return;

    const payload = {
      workout_id: updatedActivity.workout_id,
      time: newTime,
      notes: updatedActivity.notes,
      exercises: updatedActivity.exercises.map((ex) => ({
        exercise_id: ex.exercise.id,
        session_notes: ex.session_notes,
        sets: ex.sets.map((s) => ({
          reps: s.reps,
          weight: s.weight,
          unit: s.unit,
          rir: s.rir,
          notes: s.notes,
        })),
      })),
    };

    try {
      await activityApi.update(activityId, payload);
    } catch (error) {
      console.error('Failed to update activity time:', error);
      fetchLogEntry(selectedDate);
    }
  };

  const handleOpenAddExercise = async (activityId: number) => {
    setAddExerciseToActivityId(activityId);
    setExerciseSearchQuery('');
    try {
      const exercises = await exerciseApi.getAll();
      setAvailableExercises(exercises);
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
      setAvailableExercises([]);
    }
    setActiveModal('addExercise');
  };

  const handleExerciseDelete = async (activityId: number, exerciseIndex: number) => {
    if (!logEntry?.activities) return;

    const activity = logEntry.activities.find(a => a.id === activityId);
    if (!activity || activity.exercises.length <= 1) {
      // Don't allow deleting the last exercise - delete the whole workout instead
      return;
    }

    const exerciseToDelete = activity.exercises[exerciseIndex];
    const confirmed = await confirm({
      title: 'Remove Exercise',
      message: `Are you sure you want to remove "${exerciseToDelete.exercise.name}" from this workout?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    // Optimistically update local state
    const updatedActivities = logEntry.activities.map(a => {
      if (a.id !== activityId) return a;
      return {
        ...a,
        exercises: a.exercises.filter((_, idx) => idx !== exerciseIndex),
      };
    });
    setLogEntry({ ...logEntry, activities: updatedActivities });

    // Save to backend
    const updatedActivity = updatedActivities.find(a => a.id === activityId);
    if (!updatedActivity) return;

    const payload = {
      workout_id: updatedActivity.workout_id,
      time: updatedActivity.time,
      notes: updatedActivity.notes,
      exercises: updatedActivity.exercises.map(ex => ({
        exercise_id: ex.exercise.id,
        session_notes: ex.session_notes,
        sets: ex.sets.map(s => ({
          reps: s.reps,
          weight: s.weight,
          unit: s.unit,
          rir: s.rir,
          notes: s.notes,
        })),
      })),
    };

    try {
      await activityApi.update(activityId, payload);
    } catch (error) {
      console.error('Failed to delete exercise:', error);
      fetchLogEntry(selectedDate);
    }
  };

  const handleSessionNotesChange = async (activityId: number, exerciseId: number, notes: string) => {
    if (!logEntry?.activities) return;

    // Optimistically update local state
    const updatedActivities = logEntry.activities.map(a => {
      if (a.id !== activityId) return a;
      return {
        ...a,
        exercises: a.exercises.map(ex => 
          ex.id === exerciseId ? { ...ex, session_notes: notes } : ex
        ),
      };
    });
    setLogEntry({ ...logEntry, activities: updatedActivities });

    // Debounce the save - clear any pending save
    if (activitySaveTimerRef.current) {
      clearTimeout(activitySaveTimerRef.current);
    }

    const updatedActivity = updatedActivities.find(a => a.id === activityId);
    if (!updatedActivity) return;

    const payload = {
      workout_id: updatedActivity.workout_id,
      time: updatedActivity.time,
      notes: updatedActivity.notes,
      exercises: updatedActivity.exercises.map(ex => ({
        exercise_id: ex.exercise.id,
        session_notes: ex.session_notes,
        sets: ex.sets.map(s => ({
          reps: s.reps,
          weight: s.weight,
          unit: s.unit,
          rir: s.rir,
          notes: s.notes,
        })),
      })),
    };

    // Save after 500ms of no changes
    activitySaveTimerRef.current = setTimeout(async () => {
      try {
        await activityApi.update(activityId, payload);
      } catch (error) {
        console.error('Failed to update session notes:', error);
        fetchLogEntry(selectedDate);
      }
    }, 500);
  };

  const handleAddExerciseToActivity = async (exerciseId: number) => {
    if (!logEntry?.activities || !addExerciseToActivityId) return;

    const activity = logEntry.activities.find(a => a.id === addExerciseToActivityId);
    if (!activity) return;

    // Create payload with existing exercises plus the new one
    const payload = {
      workout_id: activity.workout_id,
      time: activity.time,
      notes: activity.notes,
      exercises: [
        ...activity.exercises.map((ex) => ({
          exercise_id: ex.exercise.id,
          session_notes: ex.session_notes,
          sets: ex.sets.map((s) => ({
            reps: s.reps,
            weight: s.weight,
            unit: s.unit,
            rir: s.rir,
            notes: s.notes,
          })),
        })),
        // Add the new exercise with one empty set
        {
          exercise_id: exerciseId,
          sets: [{ reps: 0, weight: 0, unit: 'lb' as const }],
        },
      ],
    };

    try {
      await activityApi.update(addExerciseToActivityId, payload);
      await fetchLogEntry(selectedDate);
      closeModal();
      setAddExerciseToActivityId(null);
    } catch (error) {
      console.error('Failed to add exercise to activity:', error);
    }
  };

  const handleCardioSubmit = async (data: CardioFormData) => {
    const existingCardio = logEntry?.cardio?.map(c => ({ type: 'existing' as const, id: c.id })) || [];
    await createOrUpdateLogEntry({
      cardio: [
        ...existingCardio,
        { type: 'new', name: data.name, time: data.time, exercise: data.exercise },
      ],
    });
    closeModal();
  };

  const handleStressSubmit = async (data: StressFormData) => {
    await createOrUpdateLogEntry({
      stress: {
        type: 'new',
        timestamp: data.timestamp,
        level: data.level,
        notes: data.notes,
      },
    });
    closeModal();
  };

  const handleHydrationSubmit = async (data: HydrationFormData) => {
    const existingHydration = logEntry?.hydration?.map(h => ({ type: 'existing' as const, id: h.id })) || [];
    await createOrUpdateLogEntry({
      hydration: [
        ...existingHydration,
        {
          type: 'new',
          timestamp: data.timestamp,
          cup_id: data.cup_id,
          servings: data.servings,
        },
      ],
    });
    closeModal();
  };

  const handleHydrationDelete = async (hydrationIndex: number) => {
    if (!logEntry || !logEntry.hydration) return;
    
    const hydrationItem = logEntry.hydration[hydrationIndex];
    const confirmed = await confirm({
      title: 'Remove Hydration',
      message: `Are you sure you want to remove "${hydrationItem.cup.name}" from today's log?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      const remainingHydration = logEntry.hydration.filter((_, idx) => idx !== hydrationIndex);
      await createOrUpdateLogEntry({
        hydration: remainingHydration.map(h => ({ type: 'existing' as const, id: h.id })),
      });
    } catch (error) {
      console.error('Failed to remove hydration:', error);
    }
  };

  const handleSupplementSubmit = async (data: SupplementFormData) => {
    const existingSupplements = logEntry?.supplements?.map(s => ({ type: 'existing' as const, id: s.supplement.id, servings: s.servings })) || [];
    
    if (data.type === 'cycle') {
      // Adding multiple supplements from a cycle day
      const newSupplements = data.items.map(item => ({
        type: 'existing' as const,
        id: item.supplement_id,
        servings: item.servings,
      }));
      await createOrUpdateLogEntry({
        supplements: [...existingSupplements, ...newSupplements],
      });
    } else if (data.supplement_id) {
      await createOrUpdateLogEntry({
        supplements: [
          ...existingSupplements,
          { type: 'existing', id: data.supplement_id, servings: data.servings },
        ],
      });
    } else if (data.brand && data.name && data.serving_name && data.compounds) {
      await createOrUpdateLogEntry({
        supplements: [
          ...existingSupplements,
          {
            type: 'new',
            brand: data.brand,
            name: data.name,
            serving_name: data.serving_name,
            compounds: data.compounds,
            servings: data.servings,
          },
        ],
      });
    }
    closeModal();
  };

  const handleSupplementDelete = async (supplementIndex: number) => {
    if (!logEntry || !logEntry.supplements) return;
    
    const entry = logEntry.supplements[supplementIndex];
    const confirmed = await confirm({
      title: 'Remove Supplement',
      message: `Are you sure you want to remove "${entry.supplement.name}" from today's log?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      const remainingSupplements = logEntry.supplements.filter((_, idx) => idx !== supplementIndex);
      await createOrUpdateLogEntry({
        supplements: remainingSupplements.map(s => ({ type: 'existing' as const, id: s.supplement.id, servings: s.servings })),
      });
    } catch (error) {
      console.error('Failed to remove supplement:', error);
    }
  };

  const handleSupplementServingsChange = async (supplementIndex: number, newServings: number) => {
    if (!logEntry || !logEntry.supplements) return;
    
    // Optimistically update the UI
    const updatedSupplements = logEntry.supplements.map((s, idx) => 
      idx === supplementIndex ? { ...s, servings: newServings } : s
    );
    setLogEntry({
      ...logEntry,
      supplements: updatedSupplements,
    });
    
    // Save to backend
    try {
      await createOrUpdateLogEntry({
        supplements: updatedSupplements.map(s => ({ type: 'existing' as const, id: s.supplement.id, servings: s.servings })),
      }, true); // Skip refetch - we already updated optimistically
    } catch (error) {
      console.error('Failed to update supplement servings:', error);
      fetchLogEntry(selectedDate);
    }
  };

  const handleQuickStatsSubmit = async (data: QuickStatsFormData) => {
    // If setting as default phase, save to localStorage
    if (data.setDefaultPhase && data.phase?.type === 'existing') {
      setDefaultPhaseId(data.phase.id);
    }
    
    await createOrUpdateLogEntry({
      phase: data.phase,
      morning_weight: data.morning_weight,
      num_standard_drinks: data.num_standard_drinks,
      notes: data.notes,
      carb_cycle_day_id: data.carb_cycle_day_id ?? undefined,
    });
    closeModal();
  };

  const handleFoodDelete = async (foodIndex: number) => {
    if (!logEntry || !logEntry.foods) return;
    
    const food = logEntry.foods[foodIndex];
    const confirmed = await confirm({
      title: 'Remove Food',
      message: `Are you sure you want to remove "${food.food.name}" from today's log?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      const remainingFoods = logEntry.foods.filter((_, idx) => idx !== foodIndex);
      await createOrUpdateLogEntry({
        foods: remainingFoods.map(f => ({ food_id: f.food.id, servings: f.servings })),
      });
    } catch (error) {
      console.error('Failed to remove food:', error);
    }
  };

  // Debounce timer for food grams changes
  const foodSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingFoodUpdateRef = useRef<{ foods: { food_id: number; servings: number }[] } | null>(null);

  const handleFoodGramsChange = (foodIndex: number, grams: number) => {
    if (!logEntry?.foods) return;

    // Calculate new servings based on the grams
    const food = logEntry.foods[foodIndex].food;
    const newServings = grams / food.serving_size;

    // Optimistically update local state immediately
    const updatedFoods = logEntry.foods.map((mf, idx) => {
      if (idx !== foodIndex) return mf;
      return { ...mf, servings: newServings };
    });
    setLogEntry({ ...logEntry, foods: updatedFoods });

    const foodsPayload = updatedFoods.map(f => ({
      food_id: f.food.id,
      servings: f.servings,
    }));

    // Store the pending update
    pendingFoodUpdateRef.current = { foods: foodsPayload };

    // Clear existing timer and set a new one (debounce)
    if (foodSaveTimerRef.current) {
      clearTimeout(foodSaveTimerRef.current);
    }

    // Save after 500ms of no changes
    foodSaveTimerRef.current = setTimeout(async () => {
      const pending = pendingFoodUpdateRef.current;
      if (!pending) return;

      try {
        await createOrUpdateLogEntry({
          foods: pending.foods,
        }, true); // Skip refetch - we already updated optimistically
      } catch (error) {
        console.error('Failed to update food grams:', error);
        // On error, refetch to get correct state
        fetchLogEntry(selectedDate);
      }
      pendingFoodUpdateRef.current = null;
    }, 500);
  };

  const handleCardioDelete = async (cardioIndex: number) => {
    if (!logEntry || !logEntry.cardio) return;
    
    const cardioItem = logEntry.cardio[cardioIndex];
    const confirmed = await confirm({
      title: 'Remove Cardio',
      message: `Are you sure you want to remove "${cardioItem.name}" from today's log?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      const remainingCardio = logEntry.cardio.filter((_, idx) => idx !== cardioIndex);
      await createOrUpdateLogEntry({
        cardio: remainingCardio.map(c => ({ type: 'existing' as const, id: c.id })),
      });
    } catch (error) {
      console.error('Failed to remove cardio:', error);
    }
  };

  const handleSleepDelete = async () => {
    if (!logEntry || !logEntry.sleep) return;
    
    const confirmed = await confirm({
      title: 'Remove Sleep',
      message: 'Are you sure you want to remove the sleep entry from today\'s log?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      await createOrUpdateLogEntry({
        sleep: undefined,
      });
    } catch (error) {
      console.error('Failed to remove sleep:', error);
    }
  };

  const handleStressDelete = async () => {
    if (!logEntry || !logEntry.stress) return;
    
    const confirmed = await confirm({
      title: 'Remove Stress',
      message: 'Are you sure you want to remove the stress entry from today\'s log?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      await createOrUpdateLogEntry({
        stress: undefined,
      });
    } catch (error) {
      console.error('Failed to remove stress:', error);
    }
  };

  const modalTitles: Record<Exclude<ModalType, null>, string> = {
    sleep: 'Add Sleep',
    food: 'Add Food',
    workout: 'Add Workout',
    cardio: 'Add Cardio',
    stress: 'Add Stress',
    hydration: 'Add Hydration',
    supplement: 'Add Supplement',
    quickstats: 'Edit Quick Stats',
    addExercise: 'Add Exercise to Workout',
  };

  const renderContent = () => {
    switch (currentView) {
      case 'foods':
        return <FoodsManager />;
      case 'meals':
        return <MealsManager />;
      case 'movement-patterns':
        return <MovementPatternsManager />;
      case 'exercises':
        return <ExercisesManager />;
      case 'workouts':
        return <WorkoutsManager />;
      case 'cups':
        return <CupsManager />;
      case 'supplements':
        return <SupplementsManager />;
      case 'compounds':
        return <CompoundsManager />;
      case 'carb-cycle':
        return <CarbCycleManager />;
      case 'mesocycle':
        return <MesocycleManager />;
      case 'supplement-cycle':
        return <SupplementCycleManager />;
      case 'stats':
        return <StatsView />;
      case 'weight':
        return <WeightManager onWeightUpdated={() => fetchLogEntry(selectedDate)} />;
      case 'daily':
      default:
        return (
          <div className="daily-view">
            <div className="daily-header">
              <DaySelector selectedDate={selectedDate} onDateChange={handleDateChange} />
              <div className="status-indicator">
                <span className={`status-dot ${apiConnected ? 'connected' : 'disconnected'}`}></span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {apiConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            <div className="daily-content">
              {loading ? (
                <div className="loading">
                  <div className="loading-spinner"></div>
                </div>
              ) : (
                <>
                  {!logEntry && (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '3rem', 
                      color: 'var(--text-muted)',
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px dashed var(--border-accent)',
                      marginBottom: '2rem'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                      <h2 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>No Entry for This Day</h2>
                      <p>Start tracking by adding data using the + buttons below</p>
                    </div>
                  )}

                  <div className="sections-grid">
                    <QuickStats logEntry={logEntry} onEdit={() => setActiveModal('quickstats')} />
                    <FoodsSection foods={logEntry?.foods} onAdd={() => setActiveModal('food')} onDelete={handleFoodDelete} onGramsChange={handleFoodGramsChange} />
                    <ActivitiesSection
                      activities={logEntry?.activities}
                      onAdd={() => setActiveModal('workout')}
                      onDelete={handleActivityDelete}
                      onSetChange={handleActivitySetChange}
                      onExerciseReorder={handleActivityExerciseReorder}
                      onTimeChange={handleActivityTimeChange}
                      onAddExercise={handleOpenAddExercise}
                      onExerciseDelete={handleExerciseDelete}
                      onSessionNotesChange={handleSessionNotesChange}
                    />
                    <SupplementsSection supplements={logEntry?.supplements} onAdd={() => setActiveModal('supplement')} onDelete={handleSupplementDelete} onServingsChange={handleSupplementServingsChange} />
                    <SleepSection sleep={logEntry?.sleep} onAdd={() => setActiveModal('sleep')} onDelete={handleSleepDelete} />
                    <HydrationSection hydration={logEntry?.hydration} onAdd={() => setActiveModal('hydration')} onDelete={handleHydrationDelete} />
                    <StressSection stress={logEntry?.stress} onAdd={() => setActiveModal('stress')} />
                    <CardioSection cardio={logEntry?.cardio} onAdd={() => setActiveModal('cardio')} onDelete={handleCardioDelete} />
                    <ProgressPicturesSection 
                      logEntryId={logEntry?.id} 
                      pictures={logEntry?.progress_pictures}
                      onPictureAdded={() => fetchLogEntry(selectedDate)}
                      onPictureDeleted={() => fetchLogEntry(selectedDate)}
                      onEnsureLogEntry={ensureLogEntry}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-layout">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="main-area">
        {renderContent()}
      </main>

      {/* Modals */}
      <Modal isOpen={activeModal !== null} onClose={closeModal} title={activeModal ? modalTitles[activeModal] : ''}>
        {activeModal === 'sleep' && (
          <SleepForm date={formatDateForApi(selectedDate)} onSubmit={handleSleepSubmit} onCancel={closeModal} />
        )}
        {activeModal === 'food' && (
          <AddFoodForm onSubmit={handleAddFoodSubmit} onCancel={closeModal} />
        )}
        {activeModal === 'workout' && (
          <WorkoutForm date={selectedDate} onSubmit={handleActivitySubmit} onCancel={closeModal} />
        )}
        {activeModal === 'cardio' && (
          <CardioForm date={selectedDate} onSubmit={handleCardioSubmit} onCancel={closeModal} />
        )}
        {activeModal === 'stress' && (
          <StressForm date={selectedDate} onSubmit={handleStressSubmit} onCancel={closeModal} />
        )}
        {activeModal === 'hydration' && (
          <HydrationForm date={selectedDate} onSubmit={handleHydrationSubmit} onCancel={closeModal} />
        )}
        {activeModal === 'supplement' && (
          <SupplementForm onSubmit={handleSupplementSubmit} onCancel={closeModal} />
        )}
        {activeModal === 'quickstats' && (
          <QuickStatsForm
            initialData={{
              phase_id: logEntry?.phase?.id,
              morning_weight: logEntry?.morning_weight,
              num_standard_drinks: logEntry?.num_standard_drinks,
              notes: logEntry?.notes,
              carb_cycle_id: logEntry?.carb_cycle?.carb_cycle.id,
              carb_cycle_day_id: logEntry?.carb_cycle?.selected_day.id,
            }}
            onSubmit={handleQuickStatsSubmit}
            onCancel={closeModal}
          />
        )}
        {activeModal === 'addExercise' && (
          <div className="add-exercise-modal">
            <input
              type="text"
              className="exercise-search-input"
              placeholder="Search exercises..."
              value={exerciseSearchQuery}
              onChange={(e) => setExerciseSearchQuery(e.target.value)}
              autoFocus
            />
            <div className="exercise-list">
              {availableExercises
                .filter(ex => ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase()))
                .map(ex => (
                  <button
                    key={ex.id}
                    className="exercise-list-item"
                    onClick={() => handleAddExerciseToActivity(ex.id)}
                  >
                    {ex.name}
                  </button>
                ))
              }
              {availableExercises.filter(ex => ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase())).length === 0 && (
                <div className="exercise-list-empty">No exercises found</div>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Dialog */}
      {ConfirmDialogComponent}
    </div>
  );
}
