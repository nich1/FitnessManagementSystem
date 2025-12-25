import type {
  LogEntry,
  LogEntryRequest,
  Phase,
  Food,
  Meal,
  MealRequest,
  Exercise,
  MovementPattern,
  MovementPatternRequest,
  Workout,
  WorkoutRequest,
  Activity,
  ActivityRequest,
  Cardio,
  Sleep,
  Stress,
  Cup,
  Hydration,
  Compound,
  Supplement,
  CarbCycle,
  CarbCycleRequest,
  SupplementCycle,
  SupplementCycleRequest,
  Mesocycle,
  MesocycleRequest,
  ProgressPicture,
  StatsQueryRequest,
  StatsQueryResponse,
  StatsConfiguration,
  StatsConfigurationRequest,
} from './types';

const API_BASE = 'http://localhost:8000';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}

// ============================================================================
// LogEntry API
// ============================================================================

export const logEntryApi = {
  getAll: () => fetchApi<LogEntry[]>('/log-entries/'),
  getById: (id: number) => fetchApi<LogEntry>(`/log-entries/${id}`),
  getByDate: (date: string) => fetchApi<LogEntry | null>(`/log-entries/date/${date}`),
  create: (data: LogEntryRequest) => fetchApi<LogEntry>('/log-entries/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: LogEntryRequest) => fetchApi<LogEntry>(`/log-entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchApi<LogEntry>(`/log-entries/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Phase API
// ============================================================================

export const phaseApi = {
  getAll: () => fetchApi<Phase[]>('/phases/'),
  getById: (id: number) => fetchApi<Phase>(`/phases/${id}`),
  create: (name: string) => fetchApi<Phase>('/phases/', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }),
  delete: (id: number) => fetchApi<Phase>(`/phases/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Food API
// ============================================================================

export const foodApi = {
  getAll: () => fetchApi<Food[]>('/foods/'),
  getById: (id: number) => fetchApi<Food>(`/foods/${id}`),
  create: (data: Omit<Food, 'id'>) => fetchApi<Food>('/foods/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Omit<Food, 'id'>) => fetchApi<Food>(`/foods/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchApi<Food>(`/foods/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Meal API
// ============================================================================

export const mealApi = {
  getAll: () => fetchApi<Meal[]>('/meals/'),
  getById: (id: number) => fetchApi<Meal>(`/meals/${id}`),
  create: (data: MealRequest) => fetchApi<Meal>('/meals/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: MealRequest) => fetchApi<Meal>(`/meals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchApi<Meal>(`/meals/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Exercise API
// ============================================================================

export const exerciseApi = {
  getAll: () => fetchApi<Exercise[]>('/exercises/'),
  getById: (id: number) => fetchApi<Exercise>(`/exercises/${id}`),
  create: (data: { name: string; movement_pattern_id?: number; notes?: string }) => fetchApi<Exercise>('/exercises/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: { name: string; movement_pattern_id?: number; notes?: string }) => fetchApi<Exercise>(`/exercises/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchApi<Exercise>(`/exercises/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Movement Pattern API
// ============================================================================

export const movementPatternApi = {
  getAll: () => fetchApi<MovementPattern[]>('/movement-patterns/'),
  getById: (id: number) => fetchApi<MovementPattern>(`/movement-patterns/${id}`),
  create: (data: MovementPatternRequest) => fetchApi<MovementPattern>('/movement-patterns/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: MovementPatternRequest) => fetchApi<MovementPattern>(`/movement-patterns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchApi<MovementPattern>(`/movement-patterns/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Workout API (Templates)
// ============================================================================

export const workoutApi = {
  getAll: () => fetchApi<Workout[]>('/workouts/'),
  getById: (id: number) => fetchApi<Workout>(`/workouts/${id}`),
  create: (data: WorkoutRequest) => fetchApi<Workout>('/workouts/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: WorkoutRequest) => fetchApi<Workout>(`/workouts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchApi<Workout>(`/workouts/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Activity API (Workout instances for log entries)
// ============================================================================

export const activityApi = {
  getAll: () => fetchApi<Activity[]>('/activities/'),
  getById: (id: number) => fetchApi<Activity>(`/activities/${id}`),
  create: (data: ActivityRequest) => fetchApi<Activity>('/activities/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: ActivityRequest) => fetchApi<Activity>(`/activities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchApi<Activity>(`/activities/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Cardio API
// ============================================================================

export const cardioApi = {
  getAll: () => fetchApi<Cardio[]>('/cardio/'),
  getById: (id: number) => fetchApi<Cardio>(`/cardio/${id}`),
  delete: (id: number) => fetchApi<Cardio>(`/cardio/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Sleep API
// ============================================================================

export const sleepApi = {
  getAll: () => fetchApi<Sleep[]>('/sleep/'),
  getById: (id: number) => fetchApi<Sleep>(`/sleep/${id}`),
  delete: (id: number) => fetchApi<Sleep>(`/sleep/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Stress API
// ============================================================================

export const stressApi = {
  getAll: () => fetchApi<Stress[]>('/stress/'),
  getById: (id: number) => fetchApi<Stress>(`/stress/${id}`),
  delete: (id: number) => fetchApi<Stress>(`/stress/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Cup API
// ============================================================================

export const cupApi = {
  getAll: () => fetchApi<Cup[]>('/cups/'),
  getById: (id: number) => fetchApi<Cup>(`/cups/${id}`),
  create: (data: Omit<Cup, 'id'>) => fetchApi<Cup>('/cups/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchApi<Cup>(`/cups/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Hydration API
// ============================================================================

export const hydrationApi = {
  getAll: () => fetchApi<Hydration[]>('/hydration/'),
  getById: (id: number) => fetchApi<Hydration>(`/hydration/${id}`),
  delete: (id: number) => fetchApi<Hydration>(`/hydration/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Compound API
// ============================================================================

export const compoundApi = {
  getAll: () => fetchApi<Compound[]>('/compounds/'),
  getById: (id: number) => fetchApi<Compound>(`/compounds/${id}`),
  create: (data: Omit<Compound, 'id'>) => fetchApi<Compound>('/compounds/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Omit<Compound, 'id'>) => fetchApi<Compound>(`/compounds/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchApi<Compound>(`/compounds/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Supplement API
// ============================================================================

interface SupplementRequest {
  brand: string;
  name: string;
  serving_name: string;
  compounds: { compound_id: number; amount: number }[];
}

export const supplementApi = {
  getAll: () => fetchApi<Supplement[]>('/supplements/'),
  getById: (id: number) => fetchApi<Supplement>(`/supplements/${id}`),
  create: (data: SupplementRequest) => fetchApi<Supplement>('/supplements/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchApi<Supplement>(`/supplements/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Carb Cycle API
// ============================================================================

export const carbCycleApi = {
  getAll: () => fetchApi<CarbCycle[]>('/carb-cycles/'),
  getById: (id: number) => fetchApi<CarbCycle>(`/carb-cycles/${id}`),
  create: (data: CarbCycleRequest) => fetchApi<CarbCycle>('/carb-cycles/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: CarbCycleRequest) => fetchApi<CarbCycle>(`/carb-cycles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchApi<CarbCycle>(`/carb-cycles/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Supplement Cycle API
// ============================================================================

export const supplementCycleApi = {
  getAll: () => fetchApi<SupplementCycle[]>('/supplement-cycles/'),
  getById: (id: number) => fetchApi<SupplementCycle>(`/supplement-cycles/${id}`),
  create: (data: SupplementCycleRequest) => fetchApi<SupplementCycle>('/supplement-cycles/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: SupplementCycleRequest) => fetchApi<SupplementCycle>(`/supplement-cycles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchApi<SupplementCycle>(`/supplement-cycles/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Mesocycle API
// ============================================================================

export const mesocycleApi = {
  getAll: () => fetchApi<Mesocycle[]>('/mesocycles/'),
  getById: (id: number) => fetchApi<Mesocycle>(`/mesocycles/${id}`),
  create: (data: MesocycleRequest) => fetchApi<Mesocycle>('/mesocycles/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: MesocycleRequest) => fetchApi<Mesocycle>(`/mesocycles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchApi<Mesocycle>(`/mesocycles/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Progress Picture API
// ============================================================================

export const progressPictureApi = {
  getByLogEntry: (logEntryId: number) => 
    fetchApi<ProgressPicture[]>(`/api/progress-pictures/log-entry/${logEntryId}`),
  
  upload: async (logEntryId: number, file: File, label?: string): Promise<ProgressPicture> => {
    const formData = new FormData();
    formData.append('file', file);
    if (label) {
      formData.append('label', label);
    }
    
    const res = await fetch(`${API_BASE}/api/progress-pictures/${logEntryId}`, {
      method: 'POST',
      body: formData,
      // Note: Don't set Content-Type header - browser will set it with boundary
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(error.detail || `Upload failed: ${res.status}`);
    }
    
    return res.json();
  },
  
  updateLabel: async (pictureId: number, label?: string): Promise<ProgressPicture> => {
    const formData = new FormData();
    if (label) {
      formData.append('label', label);
    }
    
    const res = await fetch(`${API_BASE}/api/progress-pictures/${pictureId}`, {
      method: 'PUT',
      body: formData,
    });
    
    if (!res.ok) {
      throw new Error(`Update failed: ${res.status}`);
    }
    
    return res.json();
  },
  
  delete: (pictureId: number) => 
    fetchApi<{ status: string }>(`/api/progress-pictures/${pictureId}`, { method: 'DELETE' }),
  
  getFileUrl: (filename: string) => `${API_BASE}/api/progress-pictures/file/${filename}`,
};

// ============================================================================
// Stats API
// ============================================================================

export const statsApi = {
  query: (request: StatsQueryRequest) => fetchApi<StatsQueryResponse>('/api/stats/query', {
    method: 'POST',
    body: JSON.stringify(request),
  }),
  
  getMetrics: () => fetchApi<{ value: string; label: string }[]>('/api/stats/metrics'),
  getDateRangeTypes: () => fetchApi<{ value: string; label: string }[]>('/api/stats/date-range-types'),
  getAggregationTypes: () => fetchApi<{ value: string; label: string }[]>('/api/stats/aggregation-types'),
  
  // Configurations
  getConfigurations: () => fetchApi<StatsConfiguration[]>('/api/stats/configurations'),
  getConfiguration: (id: number) => fetchApi<StatsConfiguration>(`/api/stats/configurations/${id}`),
  createConfiguration: (data: StatsConfigurationRequest) => fetchApi<StatsConfiguration>('/api/stats/configurations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateConfiguration: (id: number, data: StatsConfigurationRequest) => fetchApi<StatsConfiguration>(`/api/stats/configurations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteConfiguration: (id: number) => fetchApi<{ status: string }>(`/api/stats/configurations/${id}`, { method: 'DELETE' }),
};

