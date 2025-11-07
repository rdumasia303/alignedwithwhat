import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BarChart3, Search, Filter, Download, Eye, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { apiClient } from '../api/client'
import { cn, formatDate } from '../lib/utils'

export default function Results() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: runs, isLoading } = useQuery({
    queryKey: ['allRuns'],
    queryFn: () => apiClient.getRecentRuns(100),
    refetchInterval: 15000,
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: statusCounts.all, icon: BarChart3 },
          { label: 'Completed', value: statusCounts.completed, icon: CheckCircle2 },
          { label: 'Running', value: statusCounts.running, icon: Clock },
          { label: 'Failed', value: statusCounts.failed, icon: XCircle },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </motion.div>
          )
        })}
      </div>

      <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white">
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="running">Running</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Execution Runs</h3>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : filteredRuns && filteredRuns.length > 0 ? (
          <div className="overflow-x-auto">
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
                  <tr key={run.id} className="hover:bg-slate-900/30">
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{run.run_name || `Run #${run.id}`}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{run.run_description || 'No description'}</td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", run.status === 'completed' ? "bg-green-500/10 text-green-400" : run.status === 'running' ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-400")}>{run.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{formatDate(run.created_at)}</td>
                    <td className="px-6 py-4">
                      <button className="px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-400 text-sm">View</button>
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
    </div>
  )
}
