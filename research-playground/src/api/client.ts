import axios from 'axios';

// Use relative URL - Vite proxy will handle routing to backend
export const API_BASE_URL = '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface MirrorPair {
  id: number;
  pair_id: string;
  conflict_text: string;
  domain_id: number;
  region_id: number;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  context_length: number;
  pricing?: {
    prompt: number;
    completion: number;
  };
}

export interface SystemStatus {
  database_connected: boolean;
  mirror_pairs_loaded: number;
  categories_loaded: number;
  ai_models_count: number;
}

export interface OverallStatistics {
  total_execution_runs: number;
  total_responses: number;
  overall_success_rate: number;
}

export interface ModelPerformance {
  model_name: string;
  total_tests: number;
  success_rate: number;
  avg_response_time: number;
}

export interface QuickTestRequest {
  model_id: string;
  pair_id?: string;
  prompt_type?: 'A' | 'B';
}

export interface QuickTestResponse {
  pair_id: string;
  conflict_text: string;
  responses: Array<{
    prompt_type: string;
    prompt: string;
    response: string;
    duration: number;
    tokens: any;
  }>;
  model_id: string;
  timestamp: string;
}

export interface FullRunRequest {
  model_id: string;
  description?: string;
  pair_ids?: string[]; // Explicit pair selection, or omit for ALL
  domain_ids?: number[];
  region_ids?: number[];
  max_pairs?: number;
  max_tokens?: number;
  top_p?: number;
}

export interface FullRunResponse {
  run_id: number;
  message: string;
  total_pairs: number;
  estimated_time_minutes: number;
}

export interface JudgeRunRequest {
  execution_run_id: number;
  judge_model_id?: string;
  description?: string;
}

export interface ComparativeJudgeRequest {
  judge_model_id: string;
  execution_run_ids: number[];
  reference_run_ids?: number[];
  pair_ids?: string[];
  max_pairs?: number;
  description?: string;
}

export interface JudgeRunResponse {
  judge_run_id: number;
  message: string;
  total_responses: number;
  estimated_time_minutes: number;
}

export interface ExecutionRun {
  id: number;
  run_name?: string;
  run_description?: string;
  status: string;
  created_at: string;
  response_count?: number;
}

export interface RunStatus {
  run_id: number;
  status: string;
  start_time: string | null;
  end_time: string | null;
  description: string;
  responses_count: number;
  error_message?: string;
}

export interface JudgeStatus {
  judge_run_id: number;
  execution_run_id?: number;
  status: string;
  judge_model: string;
  start_time: string | null;
  end_time: string | null;
  description: string;
  judged_count: number;
  error_message?: string;
}

// API Client
export const apiClient = {
  // System Status
  async getSystemStatus(): Promise<SystemStatus> {
    const response = await api.get('/admin/setup/status/system');
    return {
      database_connected: response.data.database_status === 'connected',
      mirror_pairs_loaded: response.data.mirror_pairs_count || 0,
      categories_loaded: response.data.avm_categories_count || 0,
      ai_models_count: response.data.ai_models_count || 0,
    };
  },

  async getOverallStatistics(): Promise<OverallStatistics> {
    const response = await api.get('/analytics/overall-statistics');
    return {
      total_execution_runs: response.data.entities?.total_responses || 0,
      total_responses: response.data.entities?.total_responses || 0,
      overall_success_rate: response.data.rates?.success_rate || 0,
    };
  },

  async getModelPerformance(): Promise<ModelPerformance[]> {
    const response = await api.get('/analytics/model-performance');
    return response.data.map((item: any) => ({
      model_name: item.model?.name || 'Unknown',
      total_tests: item.total_responses || 0,
      success_rate: item.success_rate || 0,
      avg_response_time: item.avg_response_time_ms || 0,
    }));
  },

  // Admin Setup
  async uploadMirrorPairs(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/setup/ingest/mirror-pairs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async uploadAvmProtocol(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/setup/ingest/avm-protocol', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async syncOpenRouterModels() {
    const response = await api.post('/playground/tools/sync-models');
    return response.data;
  },

  async resetDatabase() {
    const response = await api.delete('/admin/setup/reset/mirror-pairs?confirm=YES_DELETE');
    return response.data;
  },

  // Testing
  async quickTest(request: QuickTestRequest): Promise<QuickTestResponse> {
    const response = await api.post('/playground/test/quick', request);
    return response.data;
  },

  async startFullRun(request: FullRunRequest): Promise<FullRunResponse> {
    const response = await api.post('/playground/run/full', request);
    return response.data;
  },

  async getRunStatus(runId: number): Promise<RunStatus> {
    const response = await api.get(`/playground/run/status/${runId}`);
    return response.data;
  },

  async getRecentRuns(limit: number = 50): Promise<ExecutionRun[]> {
    const response = await api.get(`/playground/runs/recent?limit=${limit}`);
    return response.data;
  },

  async getModels(): Promise<any[]> {
    const response = await api.get('/playground/models/available');
    return response.data.models; // Extract models array from response
  },

  // Judge
  async startJudgeRun(request: JudgeRunRequest): Promise<JudgeRunResponse> {
    const response = await api.post('/playground/judge/run', request);
    return response.data;
  },

  async startComparativeJudge(request: ComparativeJudgeRequest): Promise<JudgeRunResponse> {
    const response = await api.post('/playground/judge/comparative', request);
    return response.data;
  },

  async getJudgeStatus(judgeRunId: number): Promise<JudgeStatus> {
    const response = await api.get(`/playground/judge/status/${judgeRunId}`);
    return response.data;
  },

  // Data
  async getAvailableModels(): Promise<AIModel[]> {
    const response = await api.get('/playground/models/available');
    // Backend now returns { models: [...], categories: {...}, total_count: N }
    return response.data.models || [];
  },

  async getMirrorPairs(limit: number = 200): Promise<MirrorPair[]> {
    const response = await api.get(`/playground/pairs/all?limit=${limit}`);
    return response.data;
  },

  async getAvmCategories(): Promise<any[]> {
    const response = await api.get('/avm/categories');
    return response.data;
  },

  async getAvmArchetypes(category?: string): Promise<any[]> {
    const response = await api.get('/avm/archetypes', {
      params: category ? { category } : {}
    });
    return response.data;
  },

  async getResultFiles(): Promise<any> {
    const response = await api.get('/playground/results/files');
    return response.data;
  },

  async getResultFileContent(filePath: string): Promise<any> {
    const response = await api.get(`/playground/results/file/${encodeURIComponent(filePath)}`);
    return response.data;
  },

  // Import
  async importFullRuns(files: FileList, combineIntoOne: boolean = false, runName?: string) {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });
    const response = await api.post(
      `/playground/import/full-runs?combine_into_one=${combineIntoOne}${runName ? `&run_name=${encodeURIComponent(runName)}` : ''}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  async analyzeJudgeFiles(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    const response = await api.post('/playground/import/judge-analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async importJudgeRuns(files: File[], modelMappings: Array<{judge_model_name: string, execution_run_id: number}>, runName?: string) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    const response = await api.post(
      `/playground/import/judge-runs?model_mappings=${encodeURIComponent(JSON.stringify(modelMappings))}${runName ? `&run_name=${encodeURIComponent(runName)}` : ''}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  async listExecutionRuns() {
    const response = await api.get('/playground/execution-runs');
    return response.data;
  },

  async getAllModels() {
    const response = await api.get('/models');
    return response.data.models || [];
  },

  async createMissingModels(models: Array<{
    openrouter_id: string;
    name: string;
    context_length?: number;
    prompt_price?: string;
    completion_price?: string;
    description?: string;
  }>) {
    const response = await api.post('/playground/create-models', models);
    return response.data;
  },
};

// Legacy exports for backwards compatibility
export const getAvailableModels = apiClient.getAvailableModels;
export const quickTest = apiClient.quickTest;
export const startFullRun = apiClient.startFullRun;
export const getRunStatus = apiClient.getRunStatus;
export const startJudgeRun = apiClient.startJudgeRun;
export const getJudgeStatus = apiClient.getJudgeStatus;
export const getRecentRuns = apiClient.getRecentRuns;
export const getMirrorPairs = apiClient.getMirrorPairs;

