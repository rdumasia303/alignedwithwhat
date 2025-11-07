import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  X,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react'
import { cn } from '../lib/utils'
import { apiClient } from '../api/client'

export default function AvmProtocol() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedArchetype, setSelectedArchetype] = useState<any>(null)

  const { data: categories } = useQuery({
    queryKey: ['avmCategories'],
    queryFn: () => apiClient.getAvmCategories(),
  })

  const { data: archetypes, isLoading } = useQuery({
    queryKey: ['avmArchetypes', selectedCategory],
    queryFn: () => apiClient.getAvmArchetypes(selectedCategory === 'all' ? undefined : selectedCategory),
  })

  const filteredArchetypes = useMemo(() => {
    if (!archetypes) return []
    if (!searchQuery) return archetypes
    
    const query = searchQuery.toLowerCase()
    return archetypes.filter((arch: any) =>
      arch.archetype_code?.toLowerCase().includes(query) ||
      arch.archetype_name?.toLowerCase().includes(query) ||
      arch.category?.toLowerCase().includes(query) ||
      arch.description?.toLowerCase().includes(query)
    )
  }, [archetypes, searchQuery])

  const getRiskColor = (risk: string) => {
    if (risk?.toLowerCase().includes('high')) return 'text-red-400 bg-red-500/10'
    if (risk?.toLowerCase().includes('medium')) return 'text-yellow-400 bg-yellow-500/10'
    return 'text-green-400 bg-green-500/10'
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Amoral Tool': 'from-red-500 to-orange-500',
      'Principled Partner': 'from-green-500 to-emerald-500',
      'Conflicted Agent': 'from-yellow-500 to-amber-500',
      'Empathetic Accomplice': 'from-purple-500 to-pink-500'
    }
    return colors[category] || 'from-gray-500 to-slate-500'
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-white/10 rounded-xl p-4"
        >
          <span className="text-sm text-gray-400">Categories</span>
          <p className="text-2xl font-bold text-white mt-1">{categories?.length || 0}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 border border-white/10 rounded-xl p-4"
        >
          <span className="text-sm text-gray-400">Total Archetypes</span>
          <p className="text-2xl font-bold text-white mt-1">{archetypes?.length || 0}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-white/10 rounded-xl p-4"
        >
          <span className="text-sm text-gray-400">Filtered Results</span>
          <p className="text-2xl font-bold text-white mt-1">{filteredArchetypes.length}</p>
        </motion.div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search archetypes by code, name, category, or description..."
              className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white"
          >
            <option value="all">All Categories</option>
            {categories?.map((cat: any) => (
              <option key={cat.category_id} value={cat.category_name}>
                {cat.category_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Archetypes Grid */}
      {isLoading ? (
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-12 text-center">
          <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-400">Loading archetypes...</p>
        </div>
      ) : filteredArchetypes.length === 0 ? (
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-12 text-center">
          <XCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No archetypes found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArchetypes.map((archetype: any, index: number) => (
            <motion.div
              key={archetype.archetype_code}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-800/50 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all cursor-pointer"
              onClick={() => setSelectedArchetype(archetype)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  "px-3 py-1.5 rounded-lg bg-gradient-to-r text-white font-mono text-sm font-bold",
                  getCategoryColor(archetype.category)
                )}>
                  {archetype.archetype_code}
                </div>
                <span className={cn("px-2 py-1 rounded text-xs font-medium", getRiskColor(archetype.risk_profile))}>
                  {archetype.risk_profile?.split(' - ')[0] || 'Unknown'}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-white mb-2">{archetype.archetype_name}</h3>
              <p className="text-sm text-gray-400 mb-3">{archetype.category}</p>
              <p className="text-sm text-white line-clamp-3">{archetype.description}</p>

              <button
                className="mt-4 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                onClick={() => setSelectedArchetype(archetype)}
              >
                View Details
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedArchetype && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedArchetype(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "px-4 py-2 rounded-lg bg-gradient-to-r text-white font-mono text-lg font-bold",
                    getCategoryColor(selectedArchetype.category)
                  )}>
                    {selectedArchetype.archetype_code}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedArchetype.archetype_name}</h3>
                    <p className="text-gray-400">{selectedArchetype.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedArchetype(null)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-400 block mb-2">Description</label>
                  <div className="p-4 rounded-xl bg-slate-800 border border-white/5">
                    <p className="text-white leading-relaxed">{selectedArchetype.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400 block mb-2">Behavioral Signature</label>
                    <div className="p-4 rounded-xl bg-slate-800 border border-white/5">
                      <p className="text-white text-sm">{selectedArchetype.behavioral_signature}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400 block mb-2">Risk Profile</label>
                    <div className={cn("p-4 rounded-xl border", getRiskColor(selectedArchetype.risk_profile))}>
                      <p className="text-sm font-medium">{selectedArchetype.risk_profile}</p>
                    </div>
                  </div>
                </div>

                {selectedArchetype.human_analogy && (
                  <div>
                    <label className="text-sm font-medium text-gray-400 block mb-2">Human Analogy</label>
                    <div className="p-4 rounded-xl bg-slate-800 border border-white/5">
                      <p className="text-white italic">{selectedArchetype.human_analogy}</p>
                    </div>
                  </div>
                )}

                {selectedArchetype.ideal_scenarios && selectedArchetype.ideal_scenarios.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-green-400 flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Ideal Scenarios
                    </label>
                    <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                      <ul className="space-y-1">
                        {selectedArchetype.ideal_scenarios.map((scenario: string, i: number) => (
                          <li key={i} className="text-green-400 text-sm">• {scenario}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {selectedArchetype.problematic_scenarios && selectedArchetype.problematic_scenarios.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-yellow-400 flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      Problematic Scenarios
                    </label>
                    <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                      <ul className="space-y-1">
                        {selectedArchetype.problematic_scenarios.map((scenario: string, i: number) => (
                          <li key={i} className="text-yellow-400 text-sm">• {scenario}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {selectedArchetype.critical_failures && selectedArchetype.critical_failures.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-red-400 flex items-center gap-2 mb-2">
                      <XCircle className="w-4 h-4" />
                      Critical Failures
                    </label>
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                      <ul className="space-y-1">
                        {selectedArchetype.critical_failures.map((failure: string, i: number) => (
                          <li key={i} className="text-red-400 text-sm">• {failure}</li>
                        ))}
                      </ul>
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