import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Settings, 
  Play, 
  Scale, 
  BarChart3,
  Zap,
  Activity,
  Database,
  Cpu,
  FileText,
  BookOpen
} from 'lucide-react'
import Dashboard from './components/Dashboard'
import Admin from './components/Admin'
import Testing from './components/Testing'
import Judging from './components/Judging'
import Results from './components/ResultsExplorer'
import Models from './components/Models'
import MirrorPairs from './components/MirrorPairs'
import AvmProtocol from './components/AvmProtocol'
import { cn } from './lib/utils'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
})

type View = 'dashboard' | 'admin' | 'testing' | 'judge' | 'results' | 'models' | 'pairs' | 'protocol'

const navigation = [
  { 
    id: 'dashboard' as View, 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    description: 'System overview & analytics',
    gradient: 'from-blue-500 to-cyan-500'
  },
  { 
    id: 'models' as View, 
    label: 'Models', 
    icon: Cpu,
    description: 'Browse AI models',
    gradient: 'from-cyan-500 to-blue-500'
  },
  { 
    id: 'pairs' as View, 
    label: 'Mirror Pairs', 
    icon: FileText,
    description: 'Explore alignment scenarios',
    gradient: 'from-emerald-500 to-teal-500'
  },
  { 
    id: 'protocol' as View, 
    label: 'AVM Protocol', 
    icon: BookOpen,
    description: 'Archetype taxonomy',
    gradient: 'from-pink-500 to-rose-500'
  },
  { 
    id: 'admin' as View, 
    label: 'Admin', 
    icon: Settings,
    description: 'System setup & management',
    gradient: 'from-purple-500 to-pink-500'
  },
  { 
    id: 'testing' as View, 
    label: 'Testing', 
    icon: Play,
    description: 'Run model tests',
    gradient: 'from-green-500 to-emerald-500'
  },
  { 
    id: 'judge' as View, 
    label: 'Judge', 
    icon: Scale,
    description: 'Evaluate & compare',
    gradient: 'from-orange-500 to-red-500'
  },
  { 
    id: 'results' as View, 
    label: 'Results', 
    icon: BarChart3,
    description: 'Explore & export data',
    gradient: 'from-violet-500 to-purple-500'
  },
]

function App() {
  const [activeView, setActiveView] = useState<View>('dashboard')
  const activeNav = navigation.find(n => n.id === activeView)

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur-xl opacity-50"></div>
                  <div className="relative bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-xl">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    AlignedWithWhat
                  </h1>
                  <p className="text-sm text-gray-400">Research Playground</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-slow"></div>
                  <span className="text-sm text-green-400 font-medium">System Online</span>
                </div>
                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Database className="w-5 h-5 text-gray-400" />
                </button>
                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Activity className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar Navigation */}
          <aside className="w-72 min-h-[calc(100vh-73px)] border-r border-white/10 bg-slate-950/50 backdrop-blur-sm">
            <nav className="p-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = activeView === item.id
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative overflow-hidden",
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className={cn(
                          "absolute inset-0 bg-gradient-to-r opacity-10 rounded-xl",
                          item.gradient
                        )}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <div className={cn(
                      "relative p-2 rounded-lg transition-all",
                      isActive 
                        ? `bg-gradient-to-r ${item.gradient}`
                        : "bg-white/5 group-hover:bg-white/10"
                    )}>
                      <Icon className={cn(
                        "w-4 h-4",
                        isActive ? "text-white" : "text-gray-400"
                      )} />
                    </div>
                    <div className="relative flex-1 text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-h-[calc(100vh-73px)] overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="p-8"
              >
                <div className="max-w-7xl mx-auto">
                  {/* Page Header */}
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                      {activeNav && (
                        <div className={cn(
                          "p-2 rounded-lg bg-gradient-to-r",
                          activeNav.gradient
                        )}>
                          <activeNav.icon className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <h2 className="text-3xl font-bold text-white">{activeNav?.label}</h2>
                    </div>
                    <p className="text-gray-400">{activeNav?.description}</p>
                  </div>

                  {/* View Content */}
                  {activeView === 'dashboard' && <Dashboard />}
                  {activeView === 'models' && <Models />}
                  {activeView === 'pairs' && <MirrorPairs />}
                  {activeView === 'protocol' && <AvmProtocol />}
                  {activeView === 'admin' && <Admin />}
                  {activeView === 'testing' && <Testing />}
                  {activeView === 'judge' && <Judging />}
                  {activeView === 'results' && <Results />}
                </div>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </QueryClientProvider>
  )
}

export default App
