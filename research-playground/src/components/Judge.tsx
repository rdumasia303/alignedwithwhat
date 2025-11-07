import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Scale, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Play,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import { apiClient, type JudgeRunRequest } from '../api/client'
import { cn, formatDate } from '../lib/utils'

export default function Judge() {
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null)
  const [selectedJudgeModel, setSelectedJudgeModel] = useState('')
  const [judgeDescription, setJudgeDescription] = useState('')
  const [activeJudgeRunId, setActiveJudgeRunId] = useState<number | null>(null)

  const { data: models } = useQuery({
    queryKey: ['models'],
    queryFn: () => apiClient.getAvailableModels(),
  })

  const { data: completedRuns } = useQuery({
    queryKey: ['completedRuns'],
    queryFn: async () => {
      const runs = await apiClient.getRecentRuns(50)
      return runs.filter((r: any) => r.status === 'completed')
    },
    refetchInterval: 10000,
  })

  const { data: judgeStatus } = useQuery({
    queryKey: ['judgeStatus', activeJudgeRunId],
    queryFn: () => activeJudgeRunId ? apiClient.getJudgeStatus(activeJudgeRunId) : null,
    enabled: !!activeJudgeRunId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false
      }
      return 2000
    },
  })

  const startJudge = useMutation({
    mutationFn: (request: JudgeRunRequest) => apiClient.startJudgeRun(request),
    onSuccess: (data) => {
      setActiveJudgeRunId(data.judge_run_id)
    },
  })

  useEffect(() => {
    if (judgeStatus?.status === 'completed' || judgeStatus?.status === 'failed') {
      setTimeout(() => setActiveJudgeRunId(null), 5000)
    }
  }, [judgeStatus?.status])

  const handleStartJudge = () => {
    if (!selectedRunId || !selectedJudgeModel) return
    
    startJudge.mutate({
      execution_run_id: selectedRunId,
      judge_model_id: selectedJudgeModel,
      description: judgeDescription || undefined,
    })
  }

  const judgeModels = models?.filter(m => 
    m.name.toLowerCase().includes('gpt-4') || 
    m.name.toLowerCase().includes('claude')
  )

  return (
    <div className="space-y-6">
      {/* Judge Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Start Judge Run</h3>
            <p className="text-sm text-gray-400">Evaluate responses with AVM metrics</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Execution Run
            </label>
            <select
              value={selectedRunId || ''}
              onChange={(e) => setSelectedRunId(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
            >
              <option value="">Choose a completed run...</option>
              {completedRuns?.map((run: any) => (
                <option key={run.id} value={run.id}>
                  Run #{run.id} - {run.run_name || run.run_description || formatDate(run.created_at)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Judge Model
            </label>
            <select
              value={selectedJudgeModel}
              onChange={(e) => setSelectedJudgeModel(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
            >
              <option value="">Choose a judge model...</option>
              {judgeModels?.map((model) => (
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
              value={judgeDescription}
              onChange={(e) => setJudgeDescription(e.target.value)}
              placeholder="e.g., GPT-4 judge evaluation..."
              className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <button
            onClick={handleStartJudge}
            disabled={!selectedRunId || !selectedJudgeModel || startJudge.isPending || !!activeJudgeRunId}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {startJudge.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Starting Judge...
              </>
            ) : activeJudgeRunId ? (
              <>
                <Scale className="w-5 h-5 animate-pulse" />
                Judging In Progress...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Judge Run
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Active Judge Progress */}
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
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">
                Judge Run #{judgeStatus.judge_run_id}
              </h3>
              <p className="text-sm text-gray-400">
                Using {judgeStatus.judge_model}
              </p>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              judgeStatus.status === 'completed' ? "bg-green-500/10 text-green-400" :
              judgeStatus.status === 'failed' ? "bg-red-500/10 text-red-400" :
              "bg-orange-500/10 text-orange-400"
            )}>
              {judgeStatus.status}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/50">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-400">Judged</p>
              </div>
              <p className="text-2xl font-bold text-white">
                {judgeStatus.judged_count}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-400">Progress</p>
              </div>
              <p className="text-2xl font-bold text-white">
                {judgeStatus.status === 'completed' ? '100%' : 'Running...'}
              </p>
            </div>
          </div>

          {judgeStatus.error_message && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{judgeStatus.error_message}</p>
            </div>
          )}

          {judgeStatus.status === 'completed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-green-400">
                    Evaluation Complete!
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    View results in the Results tab
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Info Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-6"
      >
        <h4 className="text-white font-semibold mb-3">How Judge Works</h4>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-orange-400 mt-0.5">•</span>
            <span>Evaluates each response pair using the AVM Protocol</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-400 mt-0.5">•</span>
            <span>Calculates alignment metrics across multiple dimensions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-400 mt-0.5">•</span>
            <span>Generates comparative analysis for A vs B responses</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-400 mt-0.5">•</span>
            <span>Best results with GPT-4 or Claude models as judges</span>
          </li>
        </ul>
      </motion.div>
    </div>
  )
}
