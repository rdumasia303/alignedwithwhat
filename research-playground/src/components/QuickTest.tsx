import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { quickTest, getAvailableModels, getMirrorPairs, type QuickTestResponse } from '../api/client';

export default function QuickTest() {
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedPair, setSelectedPair] = useState('');
  const [testResult, setTestResult] = useState<QuickTestResponse | null>(null);

  // Fetch available models
  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ['models'],
    queryFn: getAvailableModels,
  });

  // Fetch mirror pairs
  const { data: pairs, isLoading: pairsLoading } = useQuery({
    queryKey: ['pairs'],
    queryFn: () => getMirrorPairs(),
  });

  // Quick test mutation
  const testMutation = useMutation({
    mutationFn: quickTest,
    onSuccess: (data) => {
      setTestResult(data);
    },
  });

  const handleTest = () => {
    if (!selectedModel) {
      alert('Please select a model');
      return;
    }

    testMutation.mutate({
      model_id: selectedModel,
      pair_id: selectedPair || undefined,
    });
  };

  return (
    <div>
      <div className="card">
        <h2>Quick Test</h2>
        <p style={{ color: '#888', marginBottom: '1.5rem' }}>
          Test a single mirror pair with any model for quick iteration and exploration.
        </p>

        <div className="form-group">
          <label>Model</label>
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={modelsLoading}
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
          <label>Mirror Pair</label>
          <select 
            value={selectedPair} 
            onChange={(e) => setSelectedPair(e.target.value)}
            disabled={pairsLoading}
          >
            <option value="">
              {pairsLoading ? 'Loading pairs...' : 'Random pair'}
            </option>
            {pairs?.map((pair: any) => (
              <option key={pair.pair_id} value={pair.pair_id}>
                {pair.pair_id}: {pair.conflict_text?.substring(0, 60)}...
              </option>
            ))}
          </select>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={handleTest}
          disabled={testMutation.isPending || !selectedModel}
        >
          {testMutation.isPending ? 'Testing...' : 'Run Test'}
        </button>

        {testMutation.isError && (
          <div className="error" style={{ marginTop: '1rem' }}>
            Error: {(testMutation.error as Error).message}
          </div>
        )}
      </div>

      {testResult && (
        <div className="card">
          <h2>Results</h2>
          <div style={{ marginBottom: '1rem', color: '#888' }}>
            <strong>Pair:</strong> {testResult.pair_id}<br />
            <strong>Conflict:</strong> {testResult.conflict_text}
          </div>

          <div className="response-container">
            {testResult.responses.map((response, idx) => (
              <div key={idx} className="response-box">
                <h3>Prompt {response.prompt_type}</h3>
                <div className="prompt">{response.prompt}</div>
                <div className="response-text">{response.response}</div>
                <div className="meta">
                  Duration: {response.duration.toFixed(2)}s | 
                  Tokens: {response.tokens?.total_tokens || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
