import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Scale, 
  CheckSquare, 
  Square, 
  Play, 
  Loader2, 
  Info,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Settings2
} from 'lucide-react'
import { apiClient, type ComparativeJudgeRequest } from '../api/client'
import { cn, formatDate } from '../lib/utils'

export default function Judging() {
  const [selectedRuns, setSelectedRuns] = useState<number[]>([])
  const [referenceRuns, setReferenceRuns] = useState<number[]>([])
  const [judgeModel, setJudgeModel] = useState('')
  const [description, setDescription] = useState('')
  const [maxPairs, setMaxPairs] = useState<number | undefined>(undefined)
  const [activeJudgeRunId, setActiveJudgeRunId] = useState<number | null>(null)
  const [modelSearch, setModelSearch] = useState('')

  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: ['allRuns'],
    queryFn: () => apiClient.getRecentRuns(100),
    refetchInterval: 10000,
  })

  const { data: models } = useQuery({
    queryKey: ['models'],
    queryFn: () => apiClient.getModels(),
  })

  // Set default judge model once models are loaded
  useEffect(() => {
    if (models && models.length > 0 && !judgeModel) {
      // Try to find Gemini 2.0 Flash as default, otherwise use first model
      const defaultModel = models.find((m: any) => m.id === 'google/gemini-2.0-flash-exp:free')
        || models.find((m: any) => m.id?.includes('gemini'))
        || models[0]
      setJudgeModel(defaultModel.id)
    }
  }, [models, judgeModel])

  // Filter models based on search
  const filteredModels = models?.filter((model: any) => {
    if (!modelSearch) return true
    const searchLower = modelSearch.toLowerCase()
    return (
      model.id?.toLowerCase().includes(searchLower) ||
      model.name?.toLowerCase().includes(searchLower) ||
      model.description?.toLowerCase().includes(searchLower)
    )
  }) || []

  const { data: judgeStatus } = useQuery({
    queryKey: ['judgeStatus', activeJudgeRunId],
    queryFn: () => activeJudgeRunId ? apiClient.getJudgeStatus(activeJudgeRunId) : null,
    enabled: !!activeJudgeRunId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false
      }
      return 3000
    },
  })

  const startJudge = useMutation({
    mutationFn: (request: ComparativeJudgeRequest) => apiClient.startComparativeJudge(request),
    onSuccess: (data) => {
      setActiveJudgeRunId(data.judge_run_id)
    },
  })

  // Stop monitoring when complete
  useEffect(() => {
    if (judgeStatus?.status === 'completed' || judgeStatus?.status === 'failed') {
      setTimeout(() => setActiveJudgeRunId(null), 5000)
    }
  }, [judgeStatus?.status])

  const toggleRunSelection = (runId: number) => {
    setSelectedRuns(prev => 
      prev.includes(runId) 
        ? prev.filter(id => id !== runId)
        : [...prev, runId]
    )
  }

  const toggleReferenceRun = (runId: number) => {
    if (!selectedRuns.includes(runId)) return
    
    setReferenceRuns(prev => 
      prev.includes(runId) 
        ? prev.filter(id => id !== runId)
        : [...prev, runId]
    )
  }

  const handleStartJudging = () => {
    if (selectedRuns.length < 2) return

    startJudge.mutate({
      judge_model_id: judgeModel,
      execution_run_ids: selectedRuns,
      reference_run_ids: referenceRuns.length > 0 ? referenceRuns : undefined,
      max_pairs: maxPairs,
      description: description || undefined,
    })
  }

  const completedRuns = runs?.filter((r: any) => r.status === 'completed') || []

  // Calculate stats
  const totalPairs = completedRuns.length > 0 
    ? Math.min(...completedRuns.map((r: any) => r.response_count / 2))  // Approximate
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
          <Scale className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Comparative Judging</h2>
          <p className="text-sm text-gray-400">Evaluate and compare model responses across mirror pairs</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-blue-300 font-medium mb-1">How Comparative Judging Works</p>
          <p className="text-blue-200/80">
            Select multiple execution runs (different models tested on same pairs). The judge LLM will 
            evaluate all model responses together, scoring each on 4 dimensions: Complicity, Firmness, 
            Authority, and Outcome Focus. Mark some runs as "Reference" for context.
          </p>
        </div>
      </div>

      {/* Judge Configuration */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Judge Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Judge Model {models && `(${models.length} available)`}
            </label>
            <input
              type="text"
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              placeholder="Search models..."
              className="w-full px-4 py-2 mb-2 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <select
              value={judgeModel}
              onChange={(e) => setJudgeModel(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
              size={Math.min(filteredModels.length + 1, 10)}
            >
              {filteredModels.length === 0 && modelSearch && (
                <option disabled>No models found</option>
              )}
              {filteredModels.map((model: any) => (
                <option key={model.id} value={model.id}>
                  {model.name || model.id}
                </option>
              ))}
            </select>
            {judgeModel && (
              <p className="mt-2 text-xs text-gray-400">
                Selected: {models?.find((m: any) => m.id === judgeModel)?.name || judgeModel}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Baseline comparison of top 3 models..."
              className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Pairs (Optional - for testing)
            </label>
            <input
              type="number"
              value={maxPairs || ''}
              onChange={(e) => setMaxPairs(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Leave empty for all pairs"
              min="1"
              className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Run Selection */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Select Execution Runs to Compare</h3>
          <div className="text-sm text-gray-400">
            {selectedRuns.length} selected {referenceRuns.length > 0 && `(${referenceRuns.length} reference)`}
          </div>
        </div>

        {runsLoading ? (
          <div className="py-8 text-center text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading runs...
          </div>
        ) : completedRuns.length === 0 ? (
          <div className="py-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No completed execution runs found</p>
            <p className="text-sm text-gray-500 mt-1">Run some models first in the Testing section</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {completedRuns.map((run: any) => {
              const isSelected = selectedRuns.includes(run.id)
              const isReference = referenceRuns.includes(run.id)
              
              return (
                <div
                  key={run.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer",
                    isSelected 
                      ? "bg-purple-500/10 border-purple-500/30" 
                      : "bg-slate-900/50 border-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => toggleRunSelection(run.id)}
                        className="transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-purple-400" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                      
                      {isSelected && (
                        <button
                          onClick={() => toggleReferenceRun(run.id)}
                          className={cn(
                            "px-2 py-1 rounded text-xs font-medium transition-colors",
                            isReference
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : "bg-slate-700 text-gray-400 border border-white/10 hover:border-blue-500/30"
                          )}
                        >
                          {isReference ? 'REF' : 'New'}
                        </button>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium truncate">
                          {run.run_name || run.name || `Run #${run.id}`}
                        </p>
                        <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs">
                          {run.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1 truncate">
                        {run.run_description || run.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{run.response_count || 0} responses</span>
                        <span>{formatDate(run.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Start Button */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        {selectedRuns.length < 2 && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-2 text-sm text-yellow-300">
            <AlertCircle className="w-4 h-4" />
            Select at least 2 execution runs to start comparative judging
          </div>
        )}

        <button
          onClick={handleStartJudging}
          disabled={selectedRuns.length < 2 || startJudge.isPending || !!activeJudgeRunId}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {startJudge.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Starting Judge Run...
            </>
          ) : activeJudgeRunId ? (
            <>
              <Settings2 className="w-5 h-5 animate-spin" />
              Judging In Progress...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Start Comparative Judging
            </>
          )}
        </button>

        {selectedRuns.length >= 2 && (
          <div className="mt-4 p-4 rounded-lg bg-slate-900/50 space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Models to compare:</span>
              <span className="text-white font-medium">{selectedRuns.length}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Reference models:</span>
              <span className="text-white font-medium">{referenceRuns.length}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Pairs to judge:</span>
              <span className="text-white font-medium">{maxPairs || 'All'}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Estimated time:</span>
              <span className="text-white font-medium">
                ~{Math.ceil((maxPairs || totalPairs) * 0.5)} min
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Active Judge Run Status */}
      {judgeStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            {judgeStatus.status === 'completed' ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : judgeStatus.status === 'failed' ? (
              <XCircle className="w-6 h-6 text-red-500" />
            ) : (
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">
                Judge Run #{judgeStatus.judge_run_id}
              </h3>
              <p className="text-sm text-gray-400">{judgeStatus.description}</p>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              judgeStatus.status === 'completed' ? "bg-green-500/10 text-green-400" :
              judgeStatus.status === 'failed' ? "bg-red-500/10 text-red-400" :
              "bg-purple-500/10 text-purple-400"
            )}>
              {judgeStatus.status}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/50">
              <p className="text-sm text-gray-400 mb-1">Evaluations</p>
              <p className="text-2xl font-bold text-white">
                {judgeStatus.judged_count || 0}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50">
              <p className="text-sm text-gray-400 mb-1">Started</p>
              <p className="text-sm text-white">
                {judgeStatus.start_time && formatDate(judgeStatus.start_time)}
              </p>
            </div>
          </div>

          {judgeStatus.error_message && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{judgeStatus.error_message}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Error Display */}
      {startJudge.isError && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
        >
          <XCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">Failed to start judge run. Please try again.</span>
        </motion.div>
      )}
    </div>
  )
}
