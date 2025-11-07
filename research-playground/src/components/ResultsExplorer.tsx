import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart3, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock,
  FileText,
  Database,
  Download,
  Eye,
  X,
  Folder,
  File,
  ChevronRight
} from 'lucide-react'
import { apiClient } from '../api/client'
import { cn, formatDate } from '../lib/utils'

type ViewTab = 'database' | 'raw'

export default function ResultsExplorer() {
  const [activeTab, setActiveTab] = useState<ViewTab>('database')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedRun, setSelectedRun] = useState<any>(null)
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [fileContent, setFileContent] = useState<any>(null)

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

  const { data: runDetails } = useQuery({
    queryKey: ['runDetails', selectedRun?.id],
    queryFn: () => apiClient.getRunStatus(selectedRun.id),
    enabled: !!selectedRun
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

  // Group files by directory
  const filesByDirectory = rawFiles?.files?.reduce((acc: any, file: any) => {
    const dir = file.directory || 'root'
    if (!acc[dir]) acc[dir] = []
    acc[dir].push(file)
    return acc
  }, {}) || {}

  const loadFileContent = async (file: any) => {
    try {
      setSelectedFile(file)
      const data = await apiClient.getResultFileContent(file.path)
      setFileContent(data)
    } catch (error) {
      console.error('Error loading file:', error)
      setFileContent({ error: 'Failed to load file' })
    }
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
          Execution Runs
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
          Raw Files ({rawFiles?.total_count || 0})
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

          {/* Search & Filter */}
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

          {/* Runs Table */}
          {loadingRuns ? (
            <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-12 text-center">
              <Clock className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-400">Loading runs...</p>
            </div>
          ) : filteredRuns && filteredRuns.length > 0 ? (
            <div className="bg-slate-800/50 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Run</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRuns.map((run: any) => (
                    <tr key={run.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-white font-medium">{run.run_name || `Run #${run.id}`}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm max-w-md truncate">
                        {run.run_description || 'No description'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1",
                          run.status === 'completed' ? "bg-green-500/10 text-green-400" :
                          run.status === 'running' ? "bg-blue-500/10 text-blue-400" :
                          "bg-red-500/10 text-red-400"
                        )}>
                          {run.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                          {run.status === 'running' && <Clock className="w-3 h-3 animate-spin" />}
                          {run.status === 'failed' && <XCircle className="w-3 h-3" />}
                          {run.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{formatDate(run.created_at)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedRun(run)}
                          className="px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-400 text-sm hover:bg-violet-500/20 transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-12 text-center">
              <XCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No runs found</p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Raw Files View */}
          <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Results Directory</h3>
              <span className="text-sm text-gray-400">
                {rawFiles?.total_count} files • {(rawFiles?.total_size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>

            {loadingRaw ? (
              <div className="py-12 text-center">
                <Clock className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-400">Loading files...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(filesByDirectory).map(([dir, files]: [string, any]) => (
                  <div key={dir} className="border border-white/10 rounded-xl overflow-hidden">
                    <div className="bg-slate-900/50 px-4 py-3 flex items-center gap-2">
                      <Folder className="w-4 h-4 text-yellow-400" />
                      <span className="text-white font-medium">{dir}</span>
                      <span className="text-xs text-gray-500 ml-auto">{files.length} files</span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {files.map((file: any) => (
                        <div key={file.path} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-900/30 transition-colors">
                          <File className="w-4 h-4 text-blue-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{file.size} • {formatDate(file.modified)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => loadFileContent(file)}
                              className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Run Details Modal */}
      <AnimatePresence>
        {selectedRun && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedRun(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {selectedRun.run_name || `Run #${selectedRun.id}`}
                  </h3>
                  <p className="text-gray-400">{selectedRun.run_description}</p>
                </div>
                <button
                  onClick={() => setSelectedRun(null)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {runDetails && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800 border border-white/5 rounded-lg p-4">
                      <span className="text-xs text-gray-400 block mb-1">Status</span>
                      <span className={cn(
                        "text-lg font-semibold",
                        runDetails.status === 'completed' ? "text-green-400" :
                        runDetails.status === 'running' ? "text-blue-400" : "text-red-400"
                      )}>
                        {runDetails.status}
                      </span>
                    </div>
                    <div className="bg-slate-800 border border-white/5 rounded-lg p-4">
                      <span className="text-xs text-gray-400 block mb-1">Responses</span>
                      <span className="text-lg font-semibold text-white">{runDetails.total_responses || 0}</span>
                    </div>
                    <div className="bg-slate-800 border border-white/5 rounded-lg p-4">
                      <span className="text-xs text-gray-400 block mb-1">Created</span>
                      <span className="text-sm text-white">{formatDate(runDetails.created_at)}</span>
                    </div>
                    <div className="bg-slate-800 border border-white/5 rounded-lg p-4">
                      <span className="text-xs text-gray-400 block mb-1">Updated</span>
                      <span className="text-sm text-white">{formatDate(runDetails.updated_at)}</span>
                    </div>
                  </div>

                  {runDetails.responses && runDetails.responses.length > 0 && (
                    <div className="bg-slate-800 border border-white/5 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Recent Responses</h4>
                      <div className="space-y-2">
                        {runDetails.responses.slice(0, 5).map((resp: any, i: number) => (
                          <div key={i} className="text-sm text-white bg-slate-900 p-3 rounded-lg">
                            <span className="text-gray-400">Response {i + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Content Modal */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setSelectedFile(null); setFileContent(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{selectedFile.name}</h3>
                  <p className="text-sm text-gray-400">{selectedFile.path}</p>
                </div>
                <button
                  onClick={() => { setSelectedFile(null); setFileContent(null); }}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {fileContent ? (
                fileContent.error ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
                    {fileContent.error}
                  </div>
                ) : (
                  <div className="bg-slate-800 border border-white/5 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(fileContent.content, null, 2)}
                    </pre>
                  </div>
                )
              ) : (
                <div className="py-12 text-center">
                  <Clock className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-400">Loading file content...</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
