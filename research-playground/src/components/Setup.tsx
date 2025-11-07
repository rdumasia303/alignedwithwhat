import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../api/client';

interface SystemStatus {
  database_status: string;
  mirror_pairs_count: number;
  prompts_count: number;
  avm_categories_count: number;
  avm_archetypes_count: number;
  ai_models_count: number;
  execution_runs_count: number;
  is_initialized: boolean;
}

export default function Setup() {
  const queryClient = useQueryClient();
  const [uploadResults, setUploadResults] = useState<any>(null);

  // Get system status
  const { data: status, isLoading: statusLoading } = useQuery<SystemStatus>({
    queryKey: ['system-status'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/admin/setup/status/system`);
      if (!response.ok) throw new Error('Failed to fetch system status');
      return response.json();
    },
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Upload mirror pairs
  const uploadMirrorPairs = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/admin/setup/ingest/mirror-pairs`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setUploadResults({ type: 'mirror-pairs', data });
      queryClient.invalidateQueries({ queryKey: ['system-status'] });
    },
  });

  // Upload AVM protocol
  const uploadAVMProtocol = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/admin/setup/ingest/avm-protocol`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setUploadResults({ type: 'avm-protocol', data });
      queryClient.invalidateQueries({ queryKey: ['system-status'] });
    },
  });

  // Reset mirror pairs
  const resetMirrorPairs = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE_URL}/admin/setup/reset/mirror-pairs`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Reset failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-status'] });
      setUploadResults({ type: 'reset-mirror-pairs', data: { message: 'Mirror pairs reset successfully' } });
    },
  });

  // Reset AVM protocol
  const resetAVMProtocol = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE_URL}/admin/setup/reset/avm-protocol`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Reset failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-status'] });
      setUploadResults({ type: 'reset-avm', data: { message: 'AVM protocol reset successfully' } });
    },
  });

  const handleMirrorPairUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMirrorPairs.mutate(file);
    }
  };

  const handleAVMProtocolUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAVMProtocol.mutate(file);
    }
  };

  const handleResetMirrorPairs = () => {
    if (confirm('⚠️ Are you sure? This will delete all mirror pairs and prompts.')) {
      resetMirrorPairs.mutate();
    }
  };

  const handleResetAVMProtocol = () => {
    if (confirm('⚠️ Are you sure? This will delete all AVM categories and archetypes.')) {
      resetAVMProtocol.mutate();
    }
  };

  const isSystemReady = status?.is_initialized ?? false;

  return (
    <div>
      {/* System Status Overview */}
      <div className="card">
        <h2>🏗️ System Status</h2>
        
        {statusLoading ? (
          <div className="loading">Loading system status...</div>
        ) : (
          <>
            <div className={`status-banner ${isSystemReady ? 'success' : 'warning'}`}>
              <div className="status-icon">
                {isSystemReady ? '✅' : '⚠️'}
              </div>
              <div className="status-text">
                <h3>{isSystemReady ? 'System Ready' : 'Setup Required'}</h3>
                <p>
                  {isSystemReady 
                    ? 'All required data is loaded. You can start testing models.'
                    : 'Please upload mirror pairs and AVM protocol to begin.'}
                </p>
              </div>
            </div>

            <div className="stats-grid mt-3">
              <div className="stat-card">
                <div className="stat-label">Database</div>
                <div className={`stat-value ${status?.database_status === 'connected' ? 'success' : 'error'}`}>
                  {status?.database_status || 'Unknown'}
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-label">Mirror Pairs</div>
                <div className={`stat-value ${(status?.mirror_pairs_count ?? 0) > 0 ? 'success' : ''}`}>
                  {status?.mirror_pairs_count ?? 0}
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-label">Prompts</div>
                <div className={`stat-value ${(status?.prompts_count ?? 0) > 0 ? 'success' : ''}`}>
                  {status?.prompts_count ?? 0}
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-label">AVM Categories</div>
                <div className={`stat-value ${(status?.avm_categories_count ?? 0) > 0 ? 'success' : ''}`}>
                  {status?.avm_categories_count ?? 0}
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-label">AVM Archetypes</div>
                <div className={`stat-value ${(status?.avm_archetypes_count ?? 0) > 0 ? 'success' : ''}`}>
                  {status?.avm_archetypes_count ?? 0}
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-label">AI Models</div>
                <div className={`stat-value ${(status?.ai_models_count ?? 0) > 0 ? 'success' : ''}`}>
                  {status?.ai_models_count ?? 0}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mirror Pairs Upload */}
      <div className="card">
        <h2>📋 Mirror Pairs Data</h2>
        <p className="card-description">
          Upload <code>mirror_pairs.yaml</code> to load test scenarios and prompts
        </p>

        <div className="upload-section">
          <label className="file-upload-btn">
            <input
              type="file"
              accept=".yaml,.yml"
              onChange={handleMirrorPairUpload}
              disabled={uploadMirrorPairs.isPending}
              style={{ display: 'none' }}
            />
            <span className="btn btn-primary">
              {uploadMirrorPairs.isPending ? '⏳ Uploading...' : '📤 Upload Mirror Pairs YAML'}
            </span>
          </label>

          {(status?.mirror_pairs_count ?? 0) > 0 && (
            <button
              onClick={handleResetMirrorPairs}
              disabled={resetMirrorPairs.isPending}
              className="btn btn-danger ml-2"
            >
              {resetMirrorPairs.isPending ? 'Resetting...' : '🗑️ Reset Mirror Pairs'}
            </button>
          )}
        </div>

        {uploadMirrorPairs.isSuccess && uploadResults?.type === 'mirror-pairs' && (
          <div className="success-message mt-2">
            ✓ Uploaded {uploadResults.data.pairs_created} mirror pairs with {uploadResults.data.prompts_created} prompts
          </div>
        )}

        {uploadMirrorPairs.isError && (
          <div className="error-message mt-2">
            ✗ Upload failed: {(uploadMirrorPairs.error as Error).message}
          </div>
        )}
      </div>

      {/* AVM Protocol Upload */}
      <div className="card">
        <h2>🎯 AVM Protocol Data</h2>
        <p className="card-description">
          Upload <code>avmprotocol.json</code> to load categories and archetypes for classification
        </p>

        <div className="upload-section">
          <label className="file-upload-btn">
            <input
              type="file"
              accept=".json"
              onChange={handleAVMProtocolUpload}
              disabled={uploadAVMProtocol.isPending}
              style={{ display: 'none' }}
            />
            <span className="btn btn-primary">
              {uploadAVMProtocol.isPending ? '⏳ Uploading...' : '📤 Upload AVM Protocol JSON'}
            </span>
          </label>

          {(status?.avm_categories_count ?? 0) > 0 && (
            <button
              onClick={handleResetAVMProtocol}
              disabled={resetAVMProtocol.isPending}
              className="btn btn-danger ml-2"
            >
              {resetAVMProtocol.isPending ? 'Resetting...' : '🗑️ Reset AVM Protocol'}
            </button>
          )}
        </div>

        {uploadAVMProtocol.isSuccess && uploadResults?.type === 'avm-protocol' && (
          <div className="success-message mt-2">
            ✓ Uploaded {uploadResults.data.categories_created} categories with {uploadResults.data.archetypes_created} archetypes
          </div>
        )}

        {uploadAVMProtocol.isError && (
          <div className="error-message mt-2">
            ✗ Upload failed: {(uploadAVMProtocol.error as Error).message}
          </div>
        )}
      </div>

      {/* Setup Instructions */}
      <div className="card">
        <h2>📚 Setup Instructions</h2>
        <div className="instructions">
          <h3>Virgin System Setup:</h3>
          <ol>
            <li>
              <strong>Start the application</strong> - Database tables are created automatically
            </li>
            <li>
              <strong>Upload Mirror Pairs</strong> - Use the button above to upload <code>mirror_pairs.yaml</code>
            </li>
            <li>
              <strong>Upload AVM Protocol</strong> - Use the button above to upload <code>avmprotocol.json</code>
            </li>
            <li>
              <strong>Sync AI Models</strong> - Go to the <strong>Tools</strong> tab and click "Sync OpenRouter Models"
            </li>
            <li>
              <strong>Run Tests</strong> - Once data is loaded, use <strong>Quick Test</strong> or <strong>Batch Run</strong> tabs
            </li>
          </ol>

          <h3 className="mt-3">File Locations:</h3>
          <ul>
            <li><code>/data/mirror_pairs.yaml</code> - Mirror pair test scenarios</li>
            <li><code>/data/avmprotocol.json</code> - AVM classification protocol</li>
          </ul>

          <h3 className="mt-3">Reset Data:</h3>
          <p>
            Use the reset buttons above to clear data and re-upload. 
            This is useful when updating your test scenarios or classification protocol.
          </p>
        </div>
      </div>

      {/* Upload Results Display */}
      {uploadResults && (
        <div className="card">
          <h2>📊 Upload Results</h2>
          <pre className="code-block">
            {JSON.stringify(uploadResults.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
