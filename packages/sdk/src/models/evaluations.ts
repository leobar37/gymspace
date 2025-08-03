export interface CreateEvaluationDto {
  gymClientId: string;
  weight: number;
  height: number;
  bodyFatPercentage?: number;
  muscleMassPercentage?: number;
  measurements?: EvaluationMeasurements;
  healthMetrics?: EvaluationHealthMetrics;
  performanceMetrics?: EvaluationPerformanceMetrics;
  notes?: string;
  goals?: string;
  recommendations?: string;
}

export interface UpdateEvaluationDto {
  gymClientId?: string;
  weight?: number;
  height?: number;
  bodyFatPercentage?: number;
  muscleMassPercentage?: number;
  measurements?: EvaluationMeasurements;
  healthMetrics?: EvaluationHealthMetrics;
  performanceMetrics?: EvaluationPerformanceMetrics;
  notes?: string;
  goals?: string;
  recommendations?: string;
}

export interface EvaluationMeasurements {
  chest?: number;
  waist?: number;
  hips?: number;
  leftArm?: number;
  rightArm?: number;
  leftThigh?: number;
  rightThigh?: number;
  [key: string]: number | undefined;
}

export interface EvaluationHealthMetrics {
  bloodPressure?: string;
  restingHeartRate?: number;
  vo2Max?: number;
  [key: string]: any;
}

export interface EvaluationPerformanceMetrics {
  benchPress?: number;
  squat?: number;
  deadlift?: number;
  [key: string]: number | undefined;
}

export interface Evaluation {
  id: string;
  gymId: string;
  gymClientId: string;
  evaluatorId: string;
  evaluationDate: string;
  weight: number;
  height: number;
  bmi: number;
  bodyFatPercentage?: number;
  muscleMassPercentage?: number;
  measurements?: EvaluationMeasurements;
  healthMetrics?: EvaluationHealthMetrics;
  performanceMetrics?: EvaluationPerformanceMetrics;
  notes?: string;
  goals?: string;
  recommendations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetClientEvaluationsParams {
  limit?: string;
}

export interface EvaluationReport {
  evaluation: Evaluation;
  client: any;
  previousEvaluation?: Evaluation;
  evolution?: {
    weight: number;
    bodyFat: number;
    muscleMass: number;
    measurements: Record<string, number>;
  };
}