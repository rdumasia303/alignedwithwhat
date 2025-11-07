import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  FileText,
  Eye,
  X,
  Grid,
  List
} from 'lucide-react'
import { apiClient } from '../api/client'
import { cn } from '../lib/utils'

export default function MirrorPairs() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<number | 'all'>('all')
  const [selectedRegion, setSelectedRegion] = useState<number | 'all'>('all')
  const [selectedPair, setSelectedPair] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const { data: pairs, isLoading } = useQuery({
    queryKey: ['mirrorPairs'],
    queryFn: () => apiClient.getMirrorPairs(500),
  })

  const filteredPairs = useMemo(() => {
    if (!pairs) return []
    
    return pairs.filter(pair => {
      const matchesSearch = searchQuery === '' ||
        pair.pair_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pair.conflict_text?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesDomain = selectedDomain === 'all' || pair.domain_id === selectedDomain
      const matchesRegion = selectedRegion === 'all' || pair.region_id === selectedRegion
      
      return matchesSearch && matchesDomain && matchesRegion
    })
  }, [pairs, searchQuery, selectedDomain, selectedRegion])

  // Get unique domains and regions
  const domains = useMemo(() => {
    if (!pairs) return []
    const domainSet = new Set(pairs.map(p => p.domain_id))
    return Array.from(domainSet).sort((a, b) => a - b)
  }, [pairs])

  const regions = useMemo(() => {
    if (!pairs) return []
    const regionSet = new Set(pairs.map(p => p.region_id))
    return Array.from(regionSet).sort((a, b) => a - b)
  }, [pairs])

  const stats = {
    total: pairs?.length || 0,
    filtered: filteredPairs.length,
    domains: domains.length,
    regions: regions.length
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Pairs', value: stats.total },
          { label: 'Filtered', value: stats.filtered },
          { label: 'Domains', value: stats.domains },
          { label: 'Regions', value: stats.regions },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-800/50 border border-white/10 rounded-xl p-4"
          >
            <span className="text-sm text-gray-400">{stat.label}</span>
            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
          </motion.div>
        ))}
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
              placeholder="Search by ID or conflict text..."
              className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white"
          >
            <option value="all">All Domains</option>
            {domains.map(d => (
              <option key={d} value={d}>Domain {d}</option>
            ))}
          </select>

          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white"
          >
            <option value="all">All Regions</option>
            {regions.map(r => (
              <option key={r} value={r}>Region {r}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-3 rounded-xl border transition-all",
                viewMode === 'grid'
                  ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                  : "bg-slate-900 border-white/10 text-gray-400"
              )}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-3 rounded-xl border transition-all",
                viewMode === 'table'
                  ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                  : "bg-slate-900 border-white/10 text-gray-400"
              )}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Pairs Display */}
      {isLoading ? (
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-12 text-center text-gray-400">
          Loading mirror pairs...
        </div>
      ) : filteredPairs.length === 0 ? (
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No mirror pairs found matching your criteria</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPairs.map((pair) => (
            <motion.div
              key={pair.pair_id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800/50 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all cursor-pointer"
              onClick={() => setSelectedPair(pair)}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-mono text-blue-400">{pair.pair_id}</span>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-xs">
                    D{pair.domain_id}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-xs">
                    R{pair.region_id}
                  </span>
                </div>
              </div>
              <p className="text-white text-sm line-clamp-3">
                {pair.conflict_text}
              </p>
              <button
                className="mt-4 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedPair(pair)
                }}
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Pair ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Conflict</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Domain</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Region</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPairs.map((pair) => (
                  <tr key={pair.pair_id} className="hover:bg-slate-900/30">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-blue-400">{pair.pair_id}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white max-w-md">
                      <div className="line-clamp-2">{pair.conflict_text}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs">
                        Domain {pair.domain_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs">
                        Region {pair.region_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedPair(pair)}
                        className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-sm hover:bg-blue-500/20"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPair && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPair(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{selectedPair.pair_id}</h3>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-sm">
                      Domain {selectedPair.domain_id}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-sm">
                      Region {selectedPair.region_id}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPair(null)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400 block mb-2">Conflict Text</label>
                  <div className="p-4 rounded-xl bg-slate-800 border border-white/5">
                    <p className="text-white leading-relaxed">{selectedPair.conflict_text}</p>
                  </div>
                </div>

                {selectedPair.full_description && (
                  <div>
                    <label className="text-sm font-medium text-gray-400 block mb-2">Full Description</label>
                    <div className="p-4 rounded-xl bg-slate-800 border border-white/5">
                      <p className="text-white leading-relaxed">{selectedPair.full_description}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
