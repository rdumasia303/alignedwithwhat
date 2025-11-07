import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  RefreshCw, 
  DollarSign,
  Cpu,
  CheckCircle2,
  XCircle,
  Database,
  Box,
  Sparkles
} from 'lucide-react'
import { apiClient } from '../api/client'
import { cn, formatNumber } from '../lib/utils'

type SortBy = 'name' | 'context' | 'price' | 'recent'

export default function Models() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [selectedModel, setSelectedModel] = useState<any>(null)

  const { data: modelsData, isLoading } = useQuery({
    queryKey: ['availableModels'],
    queryFn: () => apiClient.getAvailableModels(),
    refetchInterval: 60000, // Refresh every minute
  })

  const syncModels = useMutation({
    mutationFn: () => apiClient.syncOpenRouterModels(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availableModels'] })
      queryClient.invalidateQueries({ queryKey: ['systemStatus'] })
    },
  })

  // Process and filter models
  const { models, providers, stats } = useMemo(() => {
    if (!modelsData) return { models: [], providers: [], stats: {} }

    let filtered = modelsData

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((m: any) => 
        m.name?.toLowerCase().includes(query) ||
        m.id?.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
      )
    }

    // Provider filter
    if (selectedProvider !== 'all') {
      filtered = filtered.filter((m: any) => 
        m.id?.startsWith(selectedProvider + '/')
      )
    }

    // Sort
    filtered = [...filtered].sort((a: any, b: any) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '')
        case 'context':
          return (b.context_length || 0) - (a.context_length || 0)
        case 'price':
          const priceA = parseFloat(a.pricing?.prompt || '0')
          const priceB = parseFloat(b.pricing?.prompt || '0')
          return priceA - priceB
        case 'recent':
          return (b.created_timestamp || 0) - (a.created_timestamp || 0)
        default:
          return 0
      }
    })

    // Get unique providers
    const providerSet = new Set<string>()
    modelsData.forEach((m: any) => {
      const provider = m.id?.split('/')[0]
      if (provider) providerSet.add(provider)
    })
    const providers = Array.from(providerSet).sort()

    // Calculate stats
    const stats = {
      total: modelsData.length,
      free: modelsData.filter((m: any) => 
        m.id?.includes(':free') || 
        (m.pricing?.prompt === '0' && m.pricing?.completion === '0')
      ).length,
      moderated: modelsData.filter((m: any) => m.is_moderated).length,
      providers: providers.length
    }

    return { models: filtered, providers, stats }
  }, [modelsData, searchQuery, selectedProvider, sortBy])

  const formatPrice = (price: string | null | undefined) => {
    if (!price || price === '0') return 'Free'
    const num = parseFloat(price)
    if (num < 0.000001) return '<$0.000001'
    if (num < 0.01) return `$${num.toFixed(6)}`
    return `$${num.toFixed(4)}`
  }

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      'openai': 'from-green-500 to-emerald-500',
      'anthropic': 'from-orange-500 to-red-500',
      'google': 'from-blue-500 to-cyan-500',
      'meta-llama': 'from-purple-500 to-pink-500',
      'mistralai': 'from-yellow-500 to-orange-500',
      'cohere': 'from-indigo-500 to-purple-500',
    }
    return colors[provider] || 'from-gray-500 to-slate-500'
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Models', value: (stats as any).total || 0, icon: Database, gradient: 'from-blue-500 to-cyan-500' },
          { label: 'Providers', value: (stats as any).providers || 0, icon: Box, gradient: 'from-purple-500 to-pink-500' },
          { label: 'Free Models', value: (stats as any).free || 0, icon: Sparkles, gradient: 'from-green-500 to-emerald-500' },
          { label: 'Moderated', value: (stats as any).moderated || 0, icon: CheckCircle2, gradient: 'from-orange-500 to-red-500' },
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
                <div className={cn("p-2 rounded-lg bg-gradient-to-r", stat.gradient)}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-gray-400">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Controls */}
      <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search models by name, ID, or description..."
              className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder:text-gray-500"
            />
          </div>

          {/* Provider Filter */}
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white"
          >
            <option value="all">All Providers</option>
            {providers.map(provider => (
              <option key={provider} value={provider}>
                {provider.charAt(0).toUpperCase() + provider.slice(1)}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white"
          >
            <option value="name">Name</option>
            <option value="context">Context Length</option>
            <option value="price">Price</option>
            <option value="recent">Recently Added</option>
          </select>

          {/* Sync Button */}
          <button
            onClick={() => syncModels.mutate()}
            disabled={syncModels.isPending}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl text-white font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", syncModels.isPending && "animate-spin")} />
            Sync Models
          </button>
        </div>
      </div>

      {/* Models Grid/Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading models...</p>
          </div>
        </div>
      ) : models.length === 0 ? (
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-12 text-center">
          <Database className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No models found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((model: any) => {
            const provider = model.id?.split('/')[0] || 'unknown'
            return (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-800/50 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all cursor-pointer"
                onClick={() => setSelectedModel(model)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("px-2.5 py-1 rounded-lg bg-gradient-to-r text-white text-xs font-medium", getProviderColor(provider))}>
                    {provider}
                  </div>
                  {model.id?.includes(':free') && (
                    <div className="px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium">
                      Free
                    </div>
                  )}
                </div>

                <h3 className="text-white font-semibold mb-2 line-clamp-1">{model.name}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-1">{model.id}</p>

                <div className="space-y-2">
                  {model.context_length && (
                    <div className="flex items-center gap-2 text-sm">
                      <Cpu className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">
                        {formatNumber(model.context_length)} tokens
                      </span>
                    </div>
                  )}
                  {model.pricing?.prompt && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">
                        {formatPrice(model.pricing.prompt)}/1M
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Model Detail Modal */}
      <AnimatePresence>
        {selectedModel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedModel(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedModel.name}</h2>
                  <p className="text-sm text-gray-400">{selectedModel.id}</p>
                </div>
                <button
                  onClick={() => setSelectedModel(null)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {selectedModel.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
                  <p className="text-white">{selectedModel.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedModel.context_length && (
                  <div className="bg-slate-900/50 rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Context Length</div>
                    <div className="text-xl font-bold text-white">
                      {formatNumber(selectedModel.context_length)}
                    </div>
                  </div>
                )}
                {selectedModel.max_completion_tokens && (
                  <div className="bg-slate-900/50 rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Max Completion</div>
                    <div className="text-xl font-bold text-white">
                      {formatNumber(selectedModel.max_completion_tokens)}
                    </div>
                  </div>
                )}
              </div>

              {selectedModel.pricing && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Pricing</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedModel.pricing.prompt && (
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <div className="text-xs text-gray-400">Prompt</div>
                        <div className="text-white font-medium">{formatPrice(selectedModel.pricing.prompt)}/1M</div>
                      </div>
                    )}
                    {selectedModel.pricing.completion && (
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <div className="text-xs text-gray-400">Completion</div>
                        <div className="text-white font-medium">{formatPrice(selectedModel.pricing.completion)}/1M</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                {selectedModel.is_moderated && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-orange-400">Moderated</span>
                  </div>
                )}
                {selectedModel.id?.includes(':free') && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <Sparkles className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">Free Tier</span>
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
