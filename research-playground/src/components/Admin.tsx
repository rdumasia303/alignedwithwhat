import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Upload, 
  Database, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Loader2,
  FileJson,
  FileText,
  Zap,
  Download
} from 'lucide-react'
import { apiClient } from '../api/client'
import { cn } from '../lib/utils'

export default function Admin() {
  const queryClient = useQueryClient()
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' })
  
  // Import state
  const [fullRunFiles, setFullRunFiles] = useState<FileList | null>(null)
  const [combineRuns, setCombineRuns] = useState(false)
  const [fullRunName, setFullRunName] = useState('')
  const [missingModels, setMissingModels] = useState<any[]>([])
  const [modelDefinitions, setModelDefinitions] = useState<Record<string, any>>({})
  const [pendingImportFiles, setPendingImportFiles] = useState<FileList | null>(null) // Store files for retry
  
  const [judgeFiles, setJudgeFiles] = useState<File[] | null>(null)
  const [judgeAnalysis, setJudgeAnalysis] = useState<any>(null)
  const [judgeRunName, setJudgeRunName] = useState('')
  const [modelMapping, setModelMapping] = useState<Record<string, string>>({}) // judge_model_name -> execution_run_id

  const { data: systemStatus, isLoading } = useQuery({
    queryKey: ['systemStatus'],
    queryFn: () => apiClient.getSystemStatus(),
    refetchInterval: 5000,
  })

  const { data: executionRuns = [] } = useQuery({
    queryKey: ['executionRuns'],
    queryFn: () => apiClient.listExecutionRuns(),
  })

  const { data: allModels = [] } = useQuery({
    queryKey: ['allModels'],
    queryFn: () => apiClient.getAllModels(),
  })

  // Mutations
  const uploadMirrorPairs = useMutation({
    mutationFn: (file: File) => apiClient.uploadMirrorPairs(file),
    onSuccess: (data) => {
      setUploadStatus({
        type: 'success',
        message: `Uploaded ${data.pairs_created || 0} mirror pairs with ${data.prompts_created || 0} prompts!`,
      })
      queryClient.invalidateQueries({ queryKey: ['systemStatus'] })
    },
    onError: (error: any) => {
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.detail || 'Upload failed',
      })
    },
  })

  const uploadAvmProtocol = useMutation({
    mutationFn: (file: File) => apiClient.uploadAvmProtocol(file),
    onSuccess: (data) => {
      setUploadStatus({
        type: 'success',
        message: `AVM Protocol uploaded! ${data.categories_created} categories loaded.`,
      })
      queryClient.invalidateQueries({ queryKey: ['systemStatus'] })
    },
    onError: (error: any) => {
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.detail || 'Upload failed',
      })
    },
  })

  const syncModels = useMutation({
    mutationFn: () => apiClient.syncOpenRouterModels(),
    onSuccess: (data) => {
      setUploadStatus({
        type: 'success',
        message: `Synced ${data.synced || 0} new models from OpenRouter!`,
      })
      queryClient.invalidateQueries({ queryKey: ['systemStatus'] })
    },
    onError: (error: any) => {
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.detail || 'Sync failed',
      })
    },
  })

  const resetDb = useMutation({
    mutationFn: () => apiClient.resetDatabase(),
    onSuccess: () => {
      setUploadStatus({
        type: 'success',
        message: 'Database reset successfully!',
      })
      queryClient.invalidateQueries({ queryKey: ['systemStatus'] })
    },
    onError: (error: any) => {
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.detail || 'Reset failed',
      })
    },
  })

  const importFullRun = useMutation({
    mutationFn: () => {
      if (!fullRunFiles) throw new Error('No files selected');
      return apiClient.importFullRuns(fullRunFiles, combineRuns, fullRunName || undefined);
    },
    onSuccess: (data) => {
      if (data.missing_models && data.missing_models.length > 0) {
        // Store files for retry after model creation
        setPendingImportFiles(fullRunFiles)
        setMissingModels(data.missing_models)
        // Initialize model definitions with defaults
        const initialDefs: Record<string, any> = {}
        data.missing_models.forEach((m: any) => {
          initialDefs[m.openrouter_id] = {
            openrouter_id: m.openrouter_id,
            name: m.openrouter_id,  // Use full ID as default name
            context_length: 8000,
            prompt_price: "0",
            completion_price: "0",
            description: "",
          }
        })
        setModelDefinitions(initialDefs)
        setUploadStatus({
          type: 'error',
          message: `Import incomplete: ${data.missing_models.length} model(s) not found. Define them below, then we'll automatically re-import.`,
        })
      } else {
        setUploadStatus({
          type: 'success',
          message: `Imported ${data.total_responses_imported} responses across ${data.runs_created.length} run(s)`,
        })
        setFullRunFiles(null)
        setFullRunName('')
        setPendingImportFiles(null)
      }
      queryClient.invalidateQueries({ queryKey: ['systemStatus'] })
      queryClient.invalidateQueries({ queryKey: ['executionRuns'] })
    },
    onError: (error: any) => {
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.detail || 'Import failed',
      })
    },
  })

  const createModels = useMutation({
    mutationFn: () => {
      const modelsArray = Object.values(modelDefinitions)
      return apiClient.createMissingModels(modelsArray);
    },
    onSuccess: async (data) => {
      setUploadStatus({
        type: 'success',
        message: `Created ${data.created.length} model(s). Re-importing files automatically...`,
      })
      setMissingModels([])
      setModelDefinitions({})
      
      // Invalidate queries to refresh model list
      await queryClient.invalidateQueries({ queryKey: ['systemStatus'] })
      await queryClient.invalidateQueries({ queryKey: ['executionRuns'] })
      await queryClient.invalidateQueries({ queryKey: ['availableModels'] })
      
      // Automatically retry import with the stored files
      if (pendingImportFiles) {
        setTimeout(() => {
          importFullRun.mutate()
        }, 500) // Small delay to ensure DB updates are visible
      }
    },
    onError: (error: any) => {
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.detail || 'Model creation failed',
      })
    },
  })

  const analyzeJudge = useMutation({
    mutationFn: () => {
      if (!judgeFiles || judgeFiles.length === 0) throw new Error('No files selected');
      return apiClient.analyzeJudgeFiles(judgeFiles);
    },
    onSuccess: (data) => {
      setJudgeAnalysis(data)
      // Initialize model mapping with empty values
      const initialMapping: Record<string, string> = {}
      data.models_evaluated.forEach((model: string) => {
        initialMapping[model] = '' // Empty = auto-detect
      })
      setModelMapping(initialMapping)
      // Refresh execution runs to get latest data
      queryClient.invalidateQueries({ queryKey: ['executionRuns'] })
      setUploadStatus({
        type: 'success',
        message: `Analyzed ${data.total_evaluations} evaluations for ${data.models_evaluated.length} models`,
      })
    },
    onError: (error: any) => {
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.detail || 'Analysis failed',
      })
    },
  })

  const importJudgeRun = useMutation({
    mutationFn: () => {
      if (!judgeFiles || judgeFiles.length === 0) throw new Error('No files selected');
      if (!judgeAnalysis) throw new Error('Analysis not completed');
      
      // Build model mappings array
      const modelMappings = judgeAnalysis.models_in_judge_files.map((modelName: string) => ({
        judge_model_name: modelName,
        execution_run_id: parseInt(modelMapping[modelName])
      }));
      
      return apiClient.importJudgeRuns(judgeFiles, modelMappings, judgeRunName || undefined);
    },
    onSuccess: (data) => {
      setUploadStatus({
        type: 'success',
        message: `Imported ${data.evaluations_imported} evaluations${data.warnings.length > 0 ? ` with ${data.warnings.length} warnings` : ''}`,
      })
      setJudgeFiles(null)
      setJudgeAnalysis(null)
      setJudgeRunName('')
      setModelMapping({})
      queryClient.invalidateQueries({ queryKey: ['systemStatus'] })
    },
    onError: (error: any) => {
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.detail || 'Import failed',
      })
    },
  })

  const handleDrop = (e: React.DragEvent, type: 'pairs' | 'protocol') => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (!file) return

    if (type === 'pairs') {
      if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        uploadMirrorPairs.mutate(file)
      } else {
        setUploadStatus({ type: 'error', message: 'Please upload a YAML file' })
      }
    } else {
      if (file.name.endsWith('.json')) {
        uploadAvmProtocol.mutate(file)
      } else {
        setUploadStatus({ type: 'error', message: 'Please upload a JSON file' })
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, type: 'pairs' | 'protocol') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (type === 'pairs') {
      uploadMirrorPairs.mutate(file)
    } else {
      uploadAvmProtocol.mutate(file)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Message */}
      {uploadStatus.type && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-xl border flex items-center gap-3",
            uploadStatus.type === 'success' 
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          )}
        >
          {uploadStatus.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span>{uploadStatus.message}</span>
          <button
            onClick={() => setUploadStatus({ type: null, message: '' })}
            className="ml-auto hover:opacity-70"
          >
            ×
          </button>
        </motion.div>
      )}

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">System Status</h3>
            <p className="text-sm text-gray-400">Current database state</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Mirror Pairs</span>
                {systemStatus?.mirror_pairs_loaded ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <p className="text-2xl font-bold text-white">
                {systemStatus?.mirror_pairs_loaded || 0}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Categories</span>
                {systemStatus?.categories_loaded ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <p className="text-2xl font-bold text-white">
                {systemStatus?.categories_loaded || 0}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">AI Models</span>
                {systemStatus?.ai_models_count ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <p className="text-2xl font-bold text-white">
                {systemStatus?.ai_models_count || 0}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Mirror Pairs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Mirror Pairs</h3>
              <p className="text-sm text-gray-400">Upload YAML file</p>
            </div>
          </div>

          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
              isDragging
                ? "border-purple-500 bg-purple-500/10"
                : "border-white/20 hover:border-purple-500/50 hover:bg-purple-500/5"
            )}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => handleDrop(e, 'pairs')}
            onClick={() => document.getElementById('mirrorPairsInput')?.click()}
          >
            <input
              id="mirrorPairsInput"
              type="file"
              accept=".yaml,.yml"
              className="hidden"
              onChange={(e) => handleFileInput(e, 'pairs')}
            />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-white font-medium mb-1">Drop YAML file here</p>
            <p className="text-sm text-gray-400">or click to browse</p>
            {uploadMirrorPairs.isPending && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                <span className="text-sm text-purple-400">Uploading...</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Upload AVM Protocol */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
              <FileJson className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">AVM Protocol</h3>
              <p className="text-sm text-gray-400">Upload JSON file</p>
            </div>
          </div>

          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
              isDragging
                ? "border-orange-500 bg-orange-500/10"
                : "border-white/20 hover:border-orange-500/50 hover:bg-orange-500/5"
            )}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => handleDrop(e, 'protocol')}
            onClick={() => document.getElementById('avmProtocolInput')?.click()}
          >
            <input
              id="avmProtocolInput"
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => handleFileInput(e, 'protocol')}
            />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-white font-medium mb-1">Drop JSON file here</p>
            <p className="text-sm text-gray-400">or click to browse</p>
            {uploadAvmProtocol.isPending && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                <span className="text-sm text-orange-400">Uploading...</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
            <p className="text-sm text-gray-400">System management tools</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => syncModels.mutate()}
            disabled={syncModels.isPending}
            className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncModels.isPending ? (
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5 text-blue-400" />
            )}
            <div className="text-left">
              <p className="text-white font-medium">Sync OpenRouter Models</p>
              <p className="text-sm text-gray-400">Fetch latest AI models</p>
            </div>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Are you sure? This will delete ALL data!')) {
                resetDb.mutate()
              }
            }}
            disabled={resetDb.isPending}
            className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 hover:border-red-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resetDb.isPending ? (
              <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5 text-red-400" />
            )}
            <div className="text-left">
              <p className="text-white font-medium">Reset Database</p>
              <p className="text-sm text-gray-400">Clear all data</p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Import Existing Runs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Import Existing Runs</h3>
            <p className="text-sm text-gray-400">Upload and import execution and judge runs</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Import Full Run */}
          <div className="p-4 rounded-xl bg-slate-900/50">
            <h4 className="text-white font-medium mb-2">Import Execution Runs (JSONL)</h4>
            <p className="text-sm text-gray-400 mb-3">
              Upload one or more JSONL files containing ModelResponse records
            </p>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="file"
                  id="fullRunFiles"
                  accept=".jsonl"
                  multiple
                  className="hidden"
                  onChange={(e) => setFullRunFiles(e.target.files)}
                />
                <button
                  onClick={() => document.getElementById('fullRunFiles')?.click()}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-white/20 text-gray-300 hover:border-blue-500/50 hover:bg-slate-700 transition-all text-left"
                >
                  {fullRunFiles && fullRunFiles.length > 0 
                    ? `${fullRunFiles.length} file(s) selected` 
                    : 'Choose JSONL files...'}
                </button>
              </div>

              {fullRunFiles && fullRunFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="combineRuns"
                      checked={combineRuns}
                      onChange={(e) => setCombineRuns(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-slate-800 text-blue-500 focus:ring-blue-500/50"
                    />
                    <label htmlFor="combineRuns" className="text-sm text-gray-300">
                      Combine all files into one execution run
                    </label>
                  </div>

                  {combineRuns && (
                    <input
                      type="text"
                      value={fullRunName}
                      onChange={(e) => setFullRunName(e.target.value)}
                      placeholder="Optional: Custom run name"
                      className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                    />
                  )}

                  <button
                    onClick={() => importFullRun.mutate()}
                    disabled={importFullRun.isPending}
                    className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {importFullRun.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Importing...
                      </span>
                    ) : (
                      'Import Execution Run(s)'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Missing Models Form */}
          {missingModels.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-500/30">
              <h4 className="text-amber-400 font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Missing Models ({missingModels.length})
              </h4>
              <p className="text-sm text-gray-300 mb-2">
                These models were found in your import files but don't exist in the database. 
                Fill in the details below and click "Create Models".
              </p>
              <p className="text-xs text-blue-300 mb-4 p-2 bg-blue-900/20 rounded border border-blue-500/30">
                <strong>Auto-import:</strong> After creating the models, your files will be automatically re-imported with all responses included.
              </p>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {missingModels.map((missing: any) => {
                  const def = modelDefinitions[missing.openrouter_id] || {}
                  return (
                    <div key={missing.openrouter_id} className="p-3 rounded-lg bg-slate-800/50 space-y-2">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-white font-mono text-sm">{missing.openrouter_id}</div>
                          <div className="text-xs text-gray-400">{missing.occurrences} occurrence(s) in files</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Display Name"
                          value={def.name || ''}
                          onChange={(e) => setModelDefinitions({
                            ...modelDefinitions,
                            [missing.openrouter_id]: { ...def, name: e.target.value }
                          })}
                          className="col-span-2 px-2 py-1 bg-slate-700 border border-white/10 rounded text-white text-sm placeholder-gray-500"
                        />
                        <input
                          type="number"
                          placeholder="Context Length"
                          value={def.context_length || 8000}
                          onChange={(e) => setModelDefinitions({
                            ...modelDefinitions,
                            [missing.openrouter_id]: { ...def, context_length: parseInt(e.target.value) || 8000 }
                          })}
                          className="px-2 py-1 bg-slate-700 border border-white/10 rounded text-white text-sm placeholder-gray-500"
                        />
                        <input
                          type="text"
                          placeholder="Prompt Price"
                          value={def.prompt_price || "0"}
                          onChange={(e) => setModelDefinitions({
                            ...modelDefinitions,
                            [missing.openrouter_id]: { ...def, prompt_price: e.target.value }
                          })}
                          className="px-2 py-1 bg-slate-700 border border-white/10 rounded text-white text-sm placeholder-gray-500"
                        />
                        <input
                          type="text"
                          placeholder="Completion Price"
                          value={def.completion_price || "0"}
                          onChange={(e) => setModelDefinitions({
                            ...modelDefinitions,
                            [missing.openrouter_id]: { ...def, completion_price: e.target.value }
                          })}
                          className="col-span-2 px-2 py-1 bg-slate-700 border border-white/10 rounded text-white text-sm placeholder-gray-500"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <button
                onClick={() => createModels.mutate()}
                disabled={createModels.isPending}
                className="mt-4 w-full px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {createModels.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Models...
                  </span>
                ) : (
                  `Create ${missingModels.length} Model(s)`
                )}
              </button>
            </div>
          )}

          {/* Import Judge Run */}
          <div className="p-4 rounded-xl bg-slate-900/50">
            <h4 className="text-white font-medium mb-2">Import Judge Evaluations (JSON)</h4>
            <p className="text-sm text-gray-400 mb-3">
              Upload judge result files and map them to existing execution runs
            </p>
            
            <div className="space-y-3">
              {/* File Selection */}
              <div className="flex gap-2">
                <input
                  type="file"
                  id="judgeFiles"
                  accept=".json"
                  multiple
                  className="hidden"
                  onChange={(e) => setJudgeFiles(e.target.files ? Array.from(e.target.files) : null)}
                />
                <button
                  onClick={() => document.getElementById('judgeFiles')?.click()}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-white/20 text-gray-300 hover:border-blue-500/50 hover:bg-slate-700 transition-all text-left"
                >
                  {judgeFiles && judgeFiles.length > 0 
                    ? `${judgeFiles.length} file(s) selected` 
                    : 'Choose JSON files...'}
                </button>
              </div>

              {/* Analyze Button */}
              {judgeFiles && judgeFiles.length > 0 && !judgeAnalysis && (
                <button
                  onClick={() => analyzeJudge.mutate()}
                  disabled={analyzeJudge.isPending}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-blue-500/50 text-blue-400 hover:bg-slate-700 transition-all"
                >
                  {analyzeJudge.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    'Analyze Files'
                  )}
                </button>
              )}

              {/* Analysis Results */}
              {judgeAnalysis && (
                <div className="space-y-3 p-3 rounded-lg bg-slate-800/50 border border-blue-500/20">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Judge Model:</span>
                      <span className="text-white font-mono">{judgeAnalysis.judge_model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Evaluations:</span>
                      <span className="text-white">{judgeAnalysis.total_evaluations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Models in Judge Files:</span>
                      <span className="text-white">{judgeAnalysis.models_in_judge_files.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mirror Pairs:</span>
                      <span className="text-white">{judgeAnalysis.pair_ids.length}</span>
                    </div>
                  </div>

                  {/* EXPLICIT MODEL-TO-RUN MAPPING */}
                  {judgeAnalysis.models_in_judge_files.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-sm text-gray-300 font-semibold">
                        Model-to-Run Mapping
                        <span className="text-red-400 ml-1">* REQUIRED</span>
                      </label>
                      <p className="text-xs text-gray-400 mb-2">
                        For EACH model found in judge files, you MUST select which execution run contains its responses.
                        No auto-detection - explicit mapping required.
                      </p>
                      <div className="space-y-3 max-h-64 overflow-y-auto p-3 bg-slate-900/50 rounded-lg border border-yellow-500/30">
                        {judgeAnalysis.models_in_judge_files.map((judgeModel: string) => (
                          <div key={judgeModel} className="space-y-1 p-2 bg-slate-800/50 rounded border border-white/10">
                            <div className="text-sm text-white font-mono font-semibold">{judgeModel}</div>
                            <select
                              value={modelMapping[judgeModel] || ''}
                              onChange={(e) => setModelMapping({
                                ...modelMapping,
                                [judgeModel]: e.target.value
                              })}
                              className="w-full px-2 py-1.5 bg-slate-900 border border-yellow-500/50 rounded text-white text-sm font-medium"
                            >
                              <option value="">-- Select Execution Run --</option>
                              {executionRuns.length === 0 ? (
                                <option disabled>No execution runs found</option>
                              ) : (
                                executionRuns.map((run: any) => (
                                  <option key={run.run_id} value={run.run_id}>
                                    Run #{run.run_id}: {run.run_name} ({run.response_count} responses)
                                  </option>
                                ))
                              )}
                            </select>
                          </div>
                        ))}
                      </div>
                      
                      {/* Validation warning */}
                      {judgeAnalysis.models_in_judge_files.some((m: string) => !modelMapping[m]) && (
                        <p className="text-xs text-yellow-400 mt-2">
                          ⚠️ All models must be mapped to an execution run before importing.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Optional Run Name */}
                  <input
                    type="text"
                    value={judgeRunName}
                    onChange={(e) => setJudgeRunName(e.target.value)}
                    placeholder="Optional: Custom judge run name"
                    className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                  />

                  {/* Import Button */}
                  <button
                    onClick={() => importJudgeRun.mutate()}
                    disabled={
                      importJudgeRun.isPending ||
                      !judgeAnalysis ||
                      judgeAnalysis.models_in_judge_files.some((m: string) => !modelMapping[m])
                    }
                    className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {importJudgeRun.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Importing...
                      </span>
                    ) : (
                      'Import Judge Evaluations'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
