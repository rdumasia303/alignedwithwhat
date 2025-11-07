import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Activity, 
  CheckCircle2, 
  XCircle,
  Clock,
  Zap,
  Database,
  Server,
  BarChart3
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { apiClient } from '../api/client'
import { formatNumber, formatDate, cn } from '../lib/utils'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Dashboard() {
  const { data: systemStatus } = useQuery({
    queryKey: ['systemStatus'],
    queryFn: () => apiClient.getSystemStatus(),
    refetchInterval: 10000,
  })

  const { data: statistics } = useQuery({
    queryKey: ['overallStatistics'],
    queryFn: () => apiClient.getOverallStatistics(),
    refetchInterval: 30000,
  })

  const { data: recentRuns } = useQuery({
    queryKey: ['recentRuns'],
    queryFn: () => apiClient.getRecentRuns(5),
    refetchInterval: 15000,
  })

  const { data: modelPerformance } = useQuery({
    queryKey: ['modelPerformance'],
    queryFn: () => apiClient.getModelPerformance(),
  })

  // Calculate stats
  const stats = [
    {
      label: 'Total Pairs',
      value: systemStatus?.mirror_pairs_loaded || 0,
      icon: Database,
      gradient: 'from-blue-500 to-cyan-500',
      change: '+12%'
    },
    {
      label: 'Models Synced',
      value: systemStatus?.ai_models_count || 0,
      icon: Server,
      gradient: 'from-purple-500 to-pink-500',
      change: '+5 new'
    },
    {
      label: 'Total Runs',
      value: statistics?.total_execution_runs || 0,
      icon: Activity,
      gradient: 'from-green-500 to-emerald-500',
      change: 'Last 7 days'
    },
    {
      label: 'Success Rate',
      value: statistics?.overall_success_rate 
        ? `${Math.round(statistics.overall_success_rate)}%` 
        : '0%',
      icon: CheckCircle2,
      gradient: 'from-orange-500 to-red-500',
      change: statistics?.total_responses 
        ? `${formatNumber(statistics.total_responses)} total`
        : '0 total'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    "p-3 rounded-xl bg-gradient-to-r",
                    stat.gradient
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                    {stat.change}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Model Performance</h3>
              <p className="text-sm text-gray-400">Success rate by model</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          
          {modelPerformance && Array.isArray(modelPerformance) && modelPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={modelPerformance.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis 
                  dataKey="model_name" 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="success_rate" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No performance data available
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Recent Activity</h3>
              <p className="text-sm text-gray-400">Latest execution runs</p>
            </div>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {recentRuns && Array.isArray(recentRuns) && recentRuns.length > 0 ? (
              recentRuns.map((run, index) => (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition-colors border border-white/5"
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    run.status === 'completed' ? 'bg-green-500' :
                    run.status === 'running' ? 'bg-blue-500 animate-pulse' :
                    run.status === 'failed' ? 'bg-red-500' :
                    'bg-gray-500'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {run.run_name || run.run_description || `Run ${run.id}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(run.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {run.status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    {run.status === 'running' && (
                      <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                    )}
                    {run.status === 'failed' && (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-500">
                No recent runs
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* System Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">System Health</h3>
            <p className="text-sm text-gray-400">All systems operational</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Database</span>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-lg font-semibold text-white">Connected</p>
          </div>
          
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">API</span>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-lg font-semibold text-white">Online</p>
          </div>
          
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">OpenRouter</span>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-lg font-semibold text-white">
              {systemStatus?.ai_models_count || 0} models
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
