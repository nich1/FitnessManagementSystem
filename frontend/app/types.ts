// ============================================================================
// Domain Types
// ============================================================================

// Phase
export interface Phase {
  id: number;
  name: string;
}

// Food & Nutrition
export type AminoAcid =
  | "histidine" | "isoleucine" | "leucine" | "methionine" | "phenylalanine"
  | "threonine" | "tryptophan" | "valine" | "lysine" | "arginine"
  | "asparagine" | "glutamine" | "glycine" | "proline" | "serine"
  | "tyrosine" | "alanine" | "aspartate" | "cysteine" | "glutamate";

export interface Protein {
  grams: number;
  complete_amino_acid_profile: boolean;
  amino_acids?: AminoAcid[];
}

export interface Fat {
  grams: number;
  saturated?: number;
  monounsaturated?: number;
  polyunsaturated?: number;
  trans?: number;
  cholesterol?: number; // in mg
}

export interface Carbs {
  grams: number;
  fiber?: number;
  sugar?: number;
  added_sugars?: number;
}

export interface Food {
  id: number;
  name: string;
  serving_name: string;
  serving_size: number;
  calories: number;
  protein: Protein;
  carbs: Carbs;
  fat: Fat;
}

// Meal
export interface MealFood {
  food: Food;
  servings: number;
}

export interface Meal {
  id: number;
  name: string;
  foods: MealFood[];
}

// Movement Pattern
export interface MovementPattern {
  id: number;
  name: string;
  description?: string;
  exercise_ids?: number[];
}

// Exercise & Workout
export type Unit = "kg" | "lb";

export interface Exercise {
  id: number;
  name: string;
  movement_pattern_id?: number;
  notes?: string;  // Notes displayed in every log entry when added to workouts
}

// Workout Template Item (can be exercise or movement pattern)
export interface WorkoutItem {
  id: number;
  position: number;
  exercise?: Exercise;
  movement_pattern?: MovementPattern;
}

// Workout Template (ordered collection of exercises and movement patterns)
export interface Workout {
  id: number;
  name: string;
  description?: string;
  items: WorkoutItem[];
}

// Activity (workout instance for a log entry)
export interface ActivitySet {
  id: number;
  reps: number;
  weight: number;
  unit?: Unit;
  rir?: number;  // Reps In Reserve
  notes?: string;
}

export interface ActivityExercise {
  id: number;
  exercise: Exercise;
  position: number;
  session_notes?: string;  // Notes specific to this session
  sets: ActivitySet[];
}

export interface ActivityWorkout {
  id: number;
  name: string;
  description?: string;
}

export interface Activity {
  id: number;
  workout_id?: number;
  workout?: ActivityWorkout;  // The workout template info
  time: string;
  notes?: string;
  exercises: ActivityExercise[];
}

// Cardio
export type CardioType = "incline_walking" | "sprints" | "walking" | "running" | "cycling" | "swimming" | "other";

export interface CardioExerciseBase {
  type: CardioType;
  duration_minutes?: number;
}

export interface InclineWalking extends CardioExerciseBase {
  type: "incline_walking";
  speed: number;
  incline: number;
}

export interface Sprints extends CardioExerciseBase {
  type: "sprints";
  num_sprints: number;
  sprint_duration_seconds?: number;
  rest_duration_seconds?: number;
}

export interface Walking extends CardioExerciseBase {
  type: "walking";
}

export interface Running extends CardioExerciseBase {
  type: "running";
  distance?: number;
  pace?: string;
}

export interface Cycling extends CardioExerciseBase {
  type: "cycling";
  distance?: number;
  resistance?: number;
}

export interface Swimming extends CardioExerciseBase {
  type: "swimming";
  laps?: number;
  stroke?: string;
}

export interface OtherCardio extends CardioExerciseBase {
  type: "other";
  description: string;
}

export type CardioExercise = InclineWalking | Sprints | Walking | Running | Cycling | Swimming | OtherCardio;

export interface Cardio {
  id: number;
  name: string;
  time: string;
  exercise: CardioExercise;
}

// Sleep
export interface Nap {
  id: number;
  date: string;
  duration: number;
}

export interface Sleep {
  id: number;
  date: string;
  duration: number;
  quality: number;
  notes?: string;
  naps: Nap[];
}

// Stress
export type StressLevel = "very_low" | "low" | "medium" | "high" | "very_high";

export interface Stress {
  id: number;
  timestamp: string;
  level: StressLevel;
  notes?: string;
}

// Hydration
export type HydrationUnit = "ml" | "oz" | "l";

export interface Cup {
  id: number;
  name: string;
  amount: number;
  unit: HydrationUnit;
}

export interface Hydration {
  id: number;
  timestamp: string;
  cup: Cup;
  servings: number;
}

// Carb Cycle
export type CarbCycleDayType = "lowest" | "low" | "medium" | "high" | "highest";

export interface CarbCycleDay {
  id: number;
  day_type: CarbCycleDayType;
  carbs: number;
  position: number;
}

export interface CarbCycle {
  id: number;
  name: string;
  description?: string;
  days: CarbCycleDay[];
}

export interface CarbCycleDayRequest {
  day_type: CarbCycleDayType;
  carbs: number;
}

export interface CarbCycleRequest {
  name: string;
  description?: string;
  days: CarbCycleDayRequest[];
}

export interface LogEntryCarbCycle {
  carb_cycle: CarbCycle;
  selected_day: CarbCycleDay;
}

// Supplement Cycle
export interface SupplementCycleDayItemRequest {
  supplement_id?: number;
  compound_id?: number;
  amount: number;
}

export interface SupplementCycleDayItem {
  id: number;
  supplement_id?: number;
  compound_id?: number;
  amount: number;
}

export interface SupplementCycleDayRequest {
  items: SupplementCycleDayItemRequest[];
}

export interface SupplementCycleDay {
  id: number;
  position: number;
  items: SupplementCycleDayItem[];
}

export interface SupplementCycleRequest {
  name: string;
  description?: string;
  days: SupplementCycleDayRequest[];
}

export interface SupplementCycle {
  id: number;
  name: string;
  description?: string;
  days: SupplementCycleDay[];
}

// Mesocycle
export interface Microcycle {
  id: number;
  name: string;
  position: number;
  description?: string;
  workouts: Workout[];
}

export interface MicrocycleRequest {
  name: string;
  position: number;
  description?: string;
  workout_ids: number[];
}

export interface MesocycleRequest {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  microcycles: MicrocycleRequest[];
}

export interface Mesocycle {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  microcycles: Microcycle[];
}

// Compound & Supplement
export type CompoundUnit = "mg" | "g" | "mcg" | "iu";

export interface Compound {
  id: number;
  name: string;
  unit: CompoundUnit;
}

export interface SupplementCompound {
  compound: Compound;
  amount: number;
}

export interface Supplement {
  id: number;
  brand: string;
  name: string;
  serving_name: string;
  compounds: SupplementCompound[];
}

export interface LogEntrySupplement {
  supplement: Supplement;
  servings: number;
}

// Progress Pictures
export interface ProgressPicture {
  id: number;
  label?: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  created_at: string;
  log_entry_date?: string;  // Date of the log entry this picture belongs to
  url: string;
}

// LogEntry
export interface LogEntry {
  id: number;
  timestamp: string;
  phase?: Phase;
  morning_weight?: number;
  sleep?: Sleep;
  hydration?: Hydration[];
  foods?: MealFood[];  // Direct list of foods eaten that day
  activities?: Activity[];  // Activities (workout instances) for the day
  cardio?: Cardio[];
  supplements?: LogEntrySupplement[];
  stress?: Stress;
  num_standard_drinks?: number;
  notes?: string;
  carb_cycle?: LogEntryCarbCycle;
  progress_pictures?: ProgressPicture[];
}

// ============================================================================
// Request Types (for creating/updating)
// ============================================================================

export interface MealFoodRequest {
  food_id: number;
  servings: number;
}

export interface MealRequest {
  name: string;
  foods: MealFoodRequest[];
}

// Movement Pattern Request
export interface MovementPatternRequest {
  name: string;
  description?: string;
}

// Workout Template Request
export interface WorkoutItemRequest {
  exercise_id?: number;
  movement_pattern_id?: number;
}

export interface WorkoutRequest {
  name: string;
  description?: string;
  items: WorkoutItemRequest[];
}

// Activity Request (for log entries)
export interface ActivitySetRequest {
  reps: number;
  weight: number;
  unit?: Unit;
  rir?: number;
  notes?: string;
}

export interface ActivityExerciseRequest {
  exercise_id: number;
  session_notes?: string;
  sets: ActivitySetRequest[];
}

export interface ActivityRequest {
  workout_id?: number;
  time: string;
  notes?: string;
  exercises: ActivityExerciseRequest[];
}

// LogEntry food input (for adding foods to a day)
export interface LogEntryFoodInput {
  food_id: number;
  servings: number;
}

export interface LogEntryRequest {
  timestamp: string;
  phase?: { type: "existing"; id: number } | { type: "new"; name: string };
  morning_weight?: number;
  sleep?: { type: "existing"; id: number } | { type: "new"; date: string; duration: number; quality: number; notes?: string; naps?: { duration: number }[] };
  hydration?: ({ type: "existing"; id: number } | { type: "new"; timestamp: string; cup_id: number; servings: number })[];
  foods?: LogEntryFoodInput[];  // Direct food entries for the day
  activities?: ({ type: "existing"; id: number } | { type: "new"; workout_id?: number; time: string; notes?: string; exercises: ActivityExerciseRequest[] })[];
  cardio?: ({ type: "existing"; id: number } | { type: "new"; name: string; time: string; exercise: CardioExercise })[];
  supplements?: ({ type: "existing"; id: number; servings: number } | { type: "new"; brand: string; name: string; serving_name: string; compounds: { compound_id: number; amount: number }[]; servings: number })[];
  stress?: { type: "existing"; id: number } | { type: "new"; timestamp: string; level: StressLevel; notes?: string };
  num_standard_drinks?: number;
  notes?: string;
  carb_cycle_day_id?: number;
}

// ============================================================================
// Stats Types
// ============================================================================

export type MetricType = 
  | "weight"
  | "calories"
  | "protein"
  | "complete_protein"
  | "carbs"
  | "fat"
  | "fiber"
  | "sugar"
  | "workout_count"
  | "total_sets"
  | "total_reps"
  | "total_volume"
  | "exercise_weight"
  | "exercise_reps"
  | "exercise_sets"
  | "exercise_volume"
  | "cardio_minutes"
  | "cardio_sessions"
  | "sleep_duration"
  | "sleep_quality"
  | "hydration_oz"
  | "hydration_ml"
  | "supplement_count"
  | "stress_level"
  | "alcohol_drinks"
  | "cardio_duration"
  | "cardio_distance"
  | "cardio_speed"
  | "cardio_incline"
  | "supplement_servings"
  | "compound_amount";

export type TrainingFilterType = "none" | "exercise" | "movement_pattern" | "workout" | "mesocycle";

export type CardioFilterType = "none" | "incline_walking" | "sprints" | "walking" | "running" | "cycling" | "swimming" | "other";

export type DateRangeType =
  | "custom"
  | "mesocycle"
  | "all_time"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "this_week"
  | "this_month"
  | "this_year";

export type AggregationType = "daily" | "weekly" | "monthly";

export type ChartType = "line" | "bar" | "area";

export interface StatsQueryRequest {
  metrics: MetricType[];
  date_range_type: DateRangeType;
  start_date?: string;
  end_date?: string;
  mesocycle_id?: number;
  aggregation: AggregationType;
  // Training filters
  training_filter_type?: TrainingFilterType;
  exercise_id?: number;
  movement_pattern_id?: number;
  workout_id?: number;
  training_mesocycle_id?: number;
  // Cardio filter
  cardio_filter_type?: CardioFilterType;
  // Supplement/compound filters
  supplement_ids?: number[];
  compound_ids?: number[];
}

export interface DataPoint {
  date: string;
  value: number | null;
}

export interface MetricData {
  metric: MetricType;
  label: string;
  unit: string;
  data: DataPoint[];
  average: number | null;
  min_value: number | null;
  max_value: number | null;
  total: number | null;
}

export interface StatsQueryResponse {
  metrics: MetricData[];
  start_date: string;
  end_date: string;
  aggregation: AggregationType;
}

export interface StatsConfigurationConfig {
  metrics: MetricType[];
  date_range_type: DateRangeType;
  start_date?: string;
  end_date?: string;
  mesocycle_id?: number;
  aggregation: AggregationType;
  chart_type: ChartType;
  // Training filters
  training_filter_type?: TrainingFilterType;
  exercise_id?: number;
  movement_pattern_id?: number;
  workout_id?: number;
  training_mesocycle_id?: number;
  // Cardio filter
  cardio_filter_type?: CardioFilterType;
  // Supplement/compound filters
  supplement_ids?: number[];
  compound_ids?: number[];
}

export interface StatsConfiguration {
  id: number;
  name: string;
  description?: string;
  config: StatsConfigurationConfig;
  created_at: string;
  updated_at: string;
}

export interface StatsConfigurationRequest {
  name: string;
  description?: string;
  config: StatsConfigurationConfig;
}

// ============================================================================
// Quick Stat Card Types
// ============================================================================

export type QuickStatDisplayMode = 'value' | 'comparison';

export type ComparisonPeriod = 
  | 'yesterday'
  | 'last_7_days'
  | 'last_14_days'
  | 'last_30_days'
  | 'last_week_avg'
  | 'last_month_avg';

export interface QuickStatCardConfig {
  id: string;
  label: string;
  metric: MetricType | 'morning_weight' | 'drinks' | 'carb_day' | 'total_volume' | 'notes';
  displayMode: QuickStatDisplayMode;
  comparisonPeriod?: ComparisonPeriod;
  color?: string;
  icon?: string;
  // For exercise-specific metrics
  exerciseId?: number;
  // Custom formatting
  unit?: string;
  decimals?: number;
}

