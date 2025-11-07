import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock,
  FileText,
  Database,
  Download,
  Eye
} from 'lucide-react'
import { apiClient } from '../api/client'
import { cn, formatDate } from '../lib/utils'

type ViewTab = 'raw' | 'database'

export default function Results() {
  const [activeTab, setActiveTab] = useState<ViewTab>('database')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: runs, isLoading: loadingRuns } = useQuery({
    queryKey: ['allRuns'],
    queryFn: () => apiClient.getRecentRuns(100),
    refetchInterval: 15000,
    enabled: activeTab === 'database'
  })

  const { data: rawFiles, isLoading: loadingRaw } = useQuery({
    queryKey: ['rawResults'],
    queryFn: () => apiClient.getResultFiles(),
    enabled: activeTab === 'raw'
  })

  const filteredRuns = runs?.filter((run: any) => {
    const matchesSearch = searchQuery === '' ||
      (run.run_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (run.run_description?.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || run.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusCounts = {
    all: runs?.length || 0,
    completed: runs?.filter((r: any) => r.status === 'completed').length || 0,
    running: runs?.filter((r: any) => r.status === 'running').length || 0,
    failed: runs?.filter((r: any) => r.status === 'failed').length || 0,
  }

  return (
    <div className="space-y-6">
      {/* Tab Selector */}
      <div className="flex gap-3">
        <button
          onClick={() => setActiveTab('database')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium",
            activeTab === 'database'
              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
              : "bg-slate-800/50 text-gray-400 hover:text-white border border-white/10"
          )}
        >
          <Database className="w-4 h-4" />
          Database View
        </button>
        <button
          onClick={() => setActiveTab('raw')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium",
            activeTab === 'raw'
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "bg-slate-800/50 text-gray-400 hover:text-white border border-white/10"
          )}
        >
          <FileText className="w-4 h-4" />
          Raw Files
        </button>
      </div>

      {activeTab === 'database' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: statusCounts.all, icon: BarChart3, color: 'text-blue-400' },
              { label: 'Completed', value: statusCounts.completed, icon: CheckCircle2, color: 'text-green-400' },
              { label: 'Running', value: statusCounts.running, icon: Clock, color: 'text-yellow-400' },
              { label: 'Failed', value: statusCounts.failed, icon: XCircle, color: 'text-red-400' },
            ].map((stat, i) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-slate-800/50 border border-white/10 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={cn("w-4 h-4", stat.color)} />
                    <span className="text-sm text-gray-400">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </motion.div>
              )
            })}
          </div>

          {/* Filters */}
          <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search runs..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="running">Running</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Execution Runs Table */}
          <div className="bg-slate-800/50 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Execution Runs (Database)</h3>
              <p className="text-sm text-gray-400 mt-1">Structured data from PostgreSQL</p>
            </div>
            {loadingRuns ? (
              <div className="p-12 text-center text-gray-400">Loading...</div>
            ) : filteredRuns && filteredRuns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name/Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Responses</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredRuns.map((run: any) => (
                      <tr key={run.id} className="hover:bg-slate-900/30">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-blue-400">#{run.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{run.name || run.run_name || `Run ${run.id}`}</div>
                          <div className="text-sm text-gray-400">{run.description || run.run_description || 'No description'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white">{run.response_count || 0}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-medium",
                            run.status === 'completed' ? "bg-green-500/10 text-green-400" :
                            run.status === 'running' ? "bg-blue-500/10 text-blue-400" :
                            "bg-red-500/10 text-red-400"
                          )}>
                            {run.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {formatDate(run.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <button className="px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-400 text-sm hover:bg-violet-500/20">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400">No runs found</div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Raw Files View */}
          <div className="bg-slate-800/50 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Raw Result Files</h3>
              <p className="text-sm text-gray-400 mt-1">JSONL and JSON files from /results directory</p>
            </div>
            {loadingRaw ? (
              <div className="p-12 text-center text-gray-400">Loading raw files...</div>
            ) : rawFiles && rawFiles.length > 0 ? (
              <div className="p-6 space-y-3">
                {rawFiles.map((file: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-900/50 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <div className="flex-1">
                          <p className="text-white font-mono text-sm">{file.name}</p>
                          <div className="flex gap-4 mt-1">
                            <span className="text-xs text-gray-400">{file.size}</span>
                            <span className="text-xs text-gray-400">{file.modified}</span>
                            <span className="text-xs text-gray-500">{file.path}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-sm hover:bg-blue-500/20 flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm hover:bg-green-500/20 flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No raw result files found</p>
                <p className="text-sm text-gray-500 mt-2">Run some tests to generate results</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
