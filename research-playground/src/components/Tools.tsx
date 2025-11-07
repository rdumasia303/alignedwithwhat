import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../api/client';

export default function Tools() {
  const [testResults, setTestResults] = useState<any>(null);
  const [fullRunPath, setFullRunPath] = useState('');
  const [judgeRunPath, setJudgeRunPath] = useState('');
  const [importResults, setImportResults] = useState<any>(null);

  // Test OpenRouter Connection
  const testOpenRouter = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE_URL}/playground/tools/test-openrouter`);
      if (!response.ok) throw new Error('OpenRouter test failed');
      return response.json();
    },
    onSuccess: (data) => {
      setTestResults({ type: 'openrouter', data });
    },
  });

  // Test Database Connection
  const testDatabase = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) throw new Error('Database test failed');
      return response.json();
    },
    onSuccess: (data) => {
      setTestResults({ type: 'database', data });
    },
  });

  // Sync Models from OpenRouter
  const syncModels = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE_URL}/playground/tools/sync-models`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Model sync failed');
      return response.json();
    },
    onSuccess: (data) => {
      setTestResults({ type: 'sync', data });
    },
  });

  // Import Full Run
  const importFullRun = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE_URL}/playground/import/full-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: fullRunPath }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Import failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setImportResults({ type: 'full-run', data });
      setFullRunPath('');
    },
  });

  // Import Judge Run
  const importJudgeRun = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE_URL}/playground/import/judge-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory_path: judgeRunPath }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Import failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setImportResults({ type: 'judge-run', data });
      setJudgeRunPath('');
    },
  });

  // Get System Stats
  const { data: stats } = useQuery({
    queryKey: ['system-stats'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/playground/tools/stats`);
      return response.json();
    },
    refetchInterval: 5000,
  });

  return (
    <div>
      {/* System Health Dashboard */}
      <div className="card">
        <h2>🏥 System Health</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">API Status</div>
            <div className="stat-value success">Online</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Database</div>
            <div className="stat-value">{stats?.status || 'Unknown'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">OpenRouter</div>
            <div className="stat-value">
              {testResults?.type === 'openrouter' ? 'Tested ✓' : 'Not tested'}
            </div>
          </div>
        </div>
      </div>

      {/* Connection Tests */}
      <div className="card">
        <h2>🔌 Connection Tests</h2>
        <p className="card-description">
          Validate connectivity to external services and database
        </p>

        <div className="button-group">
          <button
            onClick={() => testOpenRouter.mutate()}
            disabled={testOpenRouter.isPending}
            className="btn btn-primary"
          >
            {testOpenRouter.isPending ? 'Testing...' : '🌐 Test OpenRouter'}
          </button>

          <button
            onClick={() => testDatabase.mutate()}
            disabled={testDatabase.isPending}
            className="btn btn-secondary"
          >
            {testDatabase.isPending ? 'Testing...' : '🗄️ Test Database'}
          </button>
        </div>

        {testResults && (
          <div className="result-box mt-3">
            <h3>✅ Test Results: {testResults.type.toUpperCase()}</h3>
            <pre className="code-block">
              {JSON.stringify(testResults.data, null, 2)}
            </pre>
          </div>
        )}

        {testOpenRouter.isError && (
          <div className="error-message mt-2">
            ✗ OpenRouter test failed: {(testOpenRouter.error as Error).message}
          </div>
        )}

        {testDatabase.isError && (
          <div className="error-message mt-2">
            ✗ Database test failed: {(testDatabase.error as Error).message}
          </div>
        )}
      </div>

      {/* Model Management */}
      <div className="card">
        <h2>🤖 Model Management</h2>
        <p className="card-description">
          Sync and manage AI models from OpenRouter
        </p>

        <button
          onClick={() => syncModels.mutate()}
          disabled={syncModels.isPending}
          className="btn btn-primary"
        >
          {syncModels.isPending ? 'Syncing...' : '🔄 Sync OpenRouter Models'}
        </button>

        {syncModels.isSuccess && (
          <div className="success-message mt-2">
            ✓ Models synced successfully
          </div>
        )}

        {syncModels.isError && (
          <div className="error-message mt-2">
            ✗ Sync failed: {(syncModels.error as Error).message}
          </div>
        )}
      </div>

      {/* Data Management */}
      <div className="card">
        <h2>💾 Data Management</h2>
        <p className="card-description">
          Export results and manage stored data
        </p>

        <div className="button-group">
          <button className="btn btn-secondary">
            📥 Export All Results
          </button>
          <button className="btn btn-secondary">
            🗂️ View Raw Files
          </button>
          <button className="btn btn-danger">
            🗑️ Clear Test Data
          </button>
        </div>
      </div>

      {/* Import Data */}
      <div className="card">
        <h2>📤 Import Existing Runs</h2>
        <p className="card-description">
          Import full runs and judge results from file system into database
        </p>

        {/* Import Full Run */}
        <div className="mb-4">
          <h3 className="mb-2">Import Full Run (JSONL)</h3>
          <p className="text-sm text-gray-600 mb-2">
            Path relative to /app/results (e.g., "full_runs/full_run_progress_model_timestamp.jsonl")
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={fullRunPath}
              onChange={(e) => setFullRunPath(e.target.value)}
              placeholder="full_runs/full_run_progress_google_gemini-2.5-flash_20251101_191624.jsonl"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={() => importFullRun.mutate()}
              disabled={importFullRun.isPending || !fullRunPath}
              className="btn btn-primary"
            >
              {importFullRun.isPending ? 'Importing...' : '📥 Import'}
            </button>
          </div>
          {importFullRun.isError && (
            <div className="error-message mt-2">
              ✗ Import failed: {(importFullRun.error as Error).message}
            </div>
          )}
        </div>

        {/* Import Judge Run */}
        <div className="mb-4">
          <h3 className="mb-2">Import Judge Run (Directory)</h3>
          <p className="text-sm text-gray-600 mb-2">
            Path to judge directory relative to /app/results (e.g., "judge_results/run_20251102_004304")
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={judgeRunPath}
              onChange={(e) => setJudgeRunPath(e.target.value)}
              placeholder="judge_results/run_20251102_004304"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={() => importJudgeRun.mutate()}
              disabled={importJudgeRun.isPending || !judgeRunPath}
              className="btn btn-primary"
            >
              {importJudgeRun.isPending ? 'Importing...' : '📥 Import'}
            </button>
          </div>
          {importJudgeRun.isError && (
            <div className="error-message mt-2">
              ✗ Import failed: {(importJudgeRun.error as Error).message}
            </div>
          )}
        </div>

        {/* Import Results */}
        {importResults && (
          <div className="result-box mt-3">
            <h3>✅ Import Success: {importResults.type.toUpperCase()}</h3>
            <div className="stats-list">
              {importResults.type === 'full-run' && (
                <>
                  <div className="stat-item">
                    <span className="stat-label">Run ID:</span>
                    <span className="stat-value">{importResults.data.run_id}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Responses Imported:</span>
                    <span className="stat-value text-green-600">{importResults.data.responses_imported}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Skipped:</span>
                    <span className="stat-value text-yellow-600">{importResults.data.skipped}</span>
                  </div>
                </>
              )}
              {importResults.type === 'judge-run' && (
                <>
                  <div className="stat-item">
                    <span className="stat-label">Judge Run ID:</span>
                    <span className="stat-value">{importResults.data.judge_run_id}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Evaluations Imported:</span>
                    <span className="stat-value text-green-600">{importResults.data.evaluations_imported}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Skipped:</span>
                    <span className="stat-value text-yellow-600">{importResults.data.skipped}</span>
                  </div>
                </>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {importResults.data.message}
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="card">
        <h2>📈 Quick Stats</h2>
        <div className="stats-list">
          <div className="stat-item">
            <span className="stat-label">Total Runs:</span>
            <span className="stat-value">{stats?.total_runs || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Responses:</span>
            <span className="stat-value">{stats?.total_responses || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Available Models:</span>
            <span className="stat-value">{stats?.available_models || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Mirror Pairs:</span>
            <span className="stat-value">{stats?.mirror_pairs || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
