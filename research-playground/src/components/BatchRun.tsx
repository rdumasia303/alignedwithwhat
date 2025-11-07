import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { startFullRun, getAvailableModels, getRunStatus, type FullRunResponse } from '../api/client';

export default function FullRun() {
  const [selectedModel, setSelectedModel] = useState('');
  const [description, setDescription] = useState('');
  const [maxPairs, setMaxPairs] = useState('');
  const [activeRun, setActiveRun] = useState<FullRunResponse | null>(null);
  const [runStatus, setRunStatus] = useState<any>(null);

  // Fetch available models
  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ['models'],
    queryFn: getAvailableModels,
  });

  // Start full run mutation
  const runMutation = useMutation({
    mutationFn: startFullRun,
    onSuccess: (data) => {
      setActiveRun(data);
    },
  });

  // Poll run status
  useEffect(() => {
    if (!activeRun) return;

    const interval = setInterval(async () => {
      try {
        const status = await getRunStatus(activeRun.run_id);
        setRunStatus(status);

        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Failed to fetch run status:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeRun]);

  const handleStartRun = () => {
    if (!selectedModel) {
      alert('Please select a model');
      return;
    }

    runMutation.mutate({
      model_id: selectedModel,
      description: description || undefined,
      max_pairs: maxPairs ? parseInt(maxPairs) : undefined,
      max_tokens: 2000,
      top_p: 1.0,
    });
  };

  const progress = runStatus 
    ? (runStatus.responses_count / (activeRun?.total_pairs || 1) * 100)
    : 0;

  return (
    <div>
      <div className="card">
        <h2>Full Run</h2>
        <p style={{ color: '#888', marginBottom: '1.5rem' }}>
          Run a complete test across all mirror pairs (or a filtered subset) and store results in the database.
        </p>

        <div className="form-group">
          <label>Model</label>
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={modelsLoading || runMutation.isPending}
          >
            <option value="">
              {modelsLoading ? 'Loading models...' : 'Select a model'}
            </option>
            {Array.isArray(modelsData) && modelsData.map((model: any) => (
              <option key={model.openrouter_id} value={model.openrouter_id}>
                {model.model_name || model.openrouter_id}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Description (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Testing Claude 3.5 Sonnet baseline"
            disabled={runMutation.isPending}
          />
        </div>

        <div className="form-group">
          <label>Max Pairs (optional)</label>
          <input
            type="number"
            value={maxPairs}
            onChange={(e) => setMaxPairs(e.target.value)}
            placeholder="Leave empty for all pairs"
            disabled={runMutation.isPending}
          />
        </div>

        <button 
          className="btn btn-primary" 
          onClick={handleStartRun}
          disabled={runMutation.isPending || !selectedModel || activeRun !== null}
        >
          {runMutation.isPending ? 'Starting...' : 'Start Full Run'}
        </button>

        {runMutation.isError && (
          <div className="error" style={{ marginTop: '1rem' }}>
            Error: {(runMutation.error as Error).message}
          </div>
        )}
      </div>

      {activeRun && (
        <div className="card">
          <h2>Run Progress</h2>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Run ID:</strong> {activeRun.run_id}<br />
            <strong>Total Pairs:</strong> {activeRun.total_pairs}<br />
            <strong>Estimated Time:</strong> {activeRun.estimated_time_minutes.toFixed(1)} minutes<br />
            <strong>Status:</strong> <span className={`status-badge status-${runStatus?.status || 'running'}`}>
              {runStatus?.status || 'running'}
            </span>
          </div>

          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-text">
            {runStatus?.responses_count || 0} / {(activeRun.total_pairs * 2)} responses
          </div>

          {runStatus?.status === 'completed' && (
            <div className="success" style={{ marginTop: '1rem' }}>
              ✓ Run completed successfully! Results stored in database.
            </div>
          )}

          {runStatus?.status === 'failed' && (
            <div className="error" style={{ marginTop: '1rem' }}>
              ✗ Run failed: {runStatus.error_message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
