import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Rocket, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Clock,
  Zap,
  Settings2,
  TrendingUp
} from 'lucide-react'
import { apiClient, type QuickTestRequest, type FullRunRequest } from '../api/client'
import { cn, formatDate } from '../lib/utils'

type TestMode = 'quick' | 'batch'

export default function Testing() {
  const [mode, setMode] = useState<TestMode>('quick')
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedPair, setSelectedPair] = useState('')
  const [runDescription, setRunDescription] = useState('')
  const [activeRunId, setActiveRunId] = useState<number | null>(null)
  const [selectedPairs, setSelectedPairs] = useState<string[]>([]) // For batch run
  const [selectAllPairs, setSelectAllPairs] = useState(true) // Default to ALL

  const { data: models } = useQuery({
    queryKey: ['models'],
    queryFn: () => apiClient.getAvailableModels(),
  })

  const { data: pairs } = useQuery({
    queryKey: ['pairs'],
    queryFn: () => apiClient.getMirrorPairs(),
  })

  const { data: recentRuns } = useQuery({
    queryKey: ['recentRuns'],
    queryFn: () => apiClient.getRecentRuns(10),
    refetchInterval: 5000,
  })

  const { data: runStatus } = useQuery({
    queryKey: ['runStatus', activeRunId],
    queryFn: () => activeRunId ? apiClient.getRunStatus(activeRunId) : null,
    enabled: !!activeRunId,
    refetchInterval: (query) => {
      // Stop polling if completed or failed
      const data = query.state.data
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false
      }
      return 2000
    },
  })

  const quickTest = useMutation({
    mutationFn: (request: QuickTestRequest) => apiClient.quickTest(request),
  })

  const startBatchRun = useMutation({
    mutationFn: (request: FullRunRequest) => apiClient.startFullRun(request),
    onSuccess: (data) => {
      setActiveRunId(data.run_id)
    },
  })

  // Stop monitoring when run completes
  useEffect(() => {
    if (runStatus?.status === 'completed' || runStatus?.status === 'failed') {
      setTimeout(() => setActiveRunId(null), 5000)
    }
  }, [runStatus?.status])

  const handleQuickTest = () => {
    if (!selectedModel || !selectedPair) return
    
    quickTest.mutate({
      model_id: selectedModel,
      pair_id: selectedPair,
    })
  }

  const handleBatchRun = () => {
    if (!selectedModel) return
    
    startBatchRun.mutate({
      model_id: selectedModel,
      description: runDescription || undefined,
      pair_ids: selectAllPairs ? undefined : selectedPairs.length > 0 ? selectedPairs : undefined,
    })
  }

  const togglePairSelection = (pairId: string) => {
    setSelectedPairs(prev => 
      prev.includes(pairId) 
        ? prev.filter(id => id !== pairId)
        : [...prev, pairId]
    )
  }

  const toggleSelectAll = () => {
    setSelectAllPairs(!selectAllPairs)
    if (!selectAllPairs) {
      setSelectedPairs([])
    }
  }

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex gap-3">
        <button
          onClick={() => setMode('quick')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium",
            mode === 'quick'
              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
              : "bg-slate-800/50 text-gray-400 hover:text-white border border-white/10"
          )}
        >
          <Zap className="w-4 h-4" />
          Quick Test
        </button>
        <button
          onClick={() => setMode('batch')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium",
            mode === 'batch'
              ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
              : "bg-slate-800/50 text-gray-400 hover:text-white border border-white/10"
          )}
        >
          <Rocket className="w-4 h-4" />
          Batch Run
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'quick' ? (
          <motion.div
            key="quick"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Quick Test Config */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Quick Test</h3>
                  <p className="text-sm text-gray-400">Test a specific pair with selected model</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Choose a model...</option>
                    {models?.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Mirror Pair
                  </label>
                  <select
                    value={selectedPair}
                    onChange={(e) => setSelectedPair(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Choose a mirror pair...</option>
                    {pairs?.map((pair) => (
                      <option key={pair.pair_id} value={pair.pair_id}>
                        {pair.pair_id}: {pair.conflict_text?.substring(0, 80)}...
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleQuickTest}
                  disabled={!selectedModel || !selectedPair || quickTest.isPending}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {quickTest.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Running Test...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Run Quick Test
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Test Results */}
            {quickTest.data && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <h3 className="text-lg font-semibold text-white">Test Results</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900/50">
                    <p className="text-sm text-gray-400 mb-2">Conflict Text</p>
                    <p className="text-white">{quickTest.data.conflict_text}</p>
                  </div>

                  {quickTest.data.responses.map((response, index) => (
                    <div key={index} className="p-4 rounded-xl bg-slate-900/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-400">
                          Prompt {response.prompt_type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {response.duration}ms
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{response.prompt}</p>
                      <div className="p-3 rounded-lg bg-slate-800 border border-white/5">
                        <p className="text-white text-sm whitespace-pre-wrap">
                          {response.response}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {quickTest.isError && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
              >
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400">Test failed. Please try again.</span>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="batch"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Batch Run Config */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Batch Run</h3>
                  <p className="text-sm text-gray-400">Test model against all mirror pairs</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-500 transition-colors"
                  >
                    <option value="">Choose a model...</option>
                    {models?.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={runDescription}
                    onChange={(e) => setRunDescription(e.target.value)}
                    placeholder="e.g., Testing GPT-4 baseline..."
                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>

                {/* Mirror Pair Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-300">
                      Mirror Pairs to Test
                    </label>
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {selectAllPairs ? '✓ All Pairs' : 'Select All'}
                    </button>
                  </div>

                  {!selectAllPairs && (
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 max-h-60 overflow-y-auto space-y-2">
                      {pairs?.map((pair) => (
                        <label
                          key={pair.pair_id}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPairs.includes(pair.pair_id)}
                            onChange={() => togglePairSelection(pair.pair_id)}
                            className="mt-1 w-4 h-4 rounded border-gray-600 bg-slate-800 text-green-500 focus:ring-green-500 focus:ring-offset-slate-900"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {pair.pair_id}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {pair.conflict_text?.substring(0, 100)}...
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {selectAllPairs && (
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 text-center">
                      <p className="text-sm text-gray-400">
                        All {pairs?.length || 0} mirror pairs will be tested
                      </p>
                    </div>
                  )}

                  {!selectAllPairs && selectedPairs.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      {selectedPairs.length} pair{selectedPairs.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                <button
                  onClick={handleBatchRun}
                  disabled={!selectedModel || startBatchRun.isPending || !!activeRunId}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {startBatchRun.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Starting Run...
                    </>
                  ) : activeRunId ? (
                    <>
                      <Settings2 className="w-5 h-5 animate-spin" />
                      Run In Progress...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5" />
                      Start Batch Run
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Active Run Progress */}
            {runStatus && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  {runStatus.status === 'completed' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : runStatus.status === 'failed' ? (
                    <XCircle className="w-6 h-6 text-red-500" />
                  ) : (
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      Run #{runStatus.run_id}
                    </h3>
                    <p className="text-sm text-gray-400">{runStatus.description}</p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium",
                    runStatus.status === 'completed' ? "bg-green-500/10 text-green-400" :
                    runStatus.status === 'failed' ? "bg-red-500/10 text-red-400" :
                    "bg-blue-500/10 text-blue-400"
                  )}>
                    {runStatus.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900/50">
                    <p className="text-sm text-gray-400 mb-1">Responses</p>
                    <p className="text-2xl font-bold text-white">
                      {runStatus.responses_count}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/50">
                    <p className="text-sm text-gray-400 mb-1">Started</p>
                    <p className="text-sm text-white">
                      {runStatus.start_time && formatDate(runStatus.start_time)}
                    </p>
                  </div>
                </div>

                {runStatus.error_message && (
                  <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">{runStatus.error_message}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Recent Runs */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Recent Runs</h3>
                  <p className="text-sm text-gray-400">Latest execution history</p>
                </div>
              </div>

              <div className="space-y-2">
                {recentRuns && recentRuns.length > 0 ? (
                  recentRuns.map((run: any) => (
                    <div
                      key={run.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition-colors border border-white/5"
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        run.status === 'completed' ? 'bg-green-500' :
                        run.status === 'running' ? 'bg-blue-500 animate-pulse' :
                        'bg-gray-500'
                      )} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          {run.run_name || run.run_description || `Run #${run.id}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(run.created_at)}
                        </p>
                      </div>
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    No runs yet
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
