import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Brain, 
  Shield, 
  Users, 
  BarChart3,
  Eye,
  Activity,
  MessageSquare,
  Info
} from 'lucide-react';

// Components (we'll create these next)
import { PersonalityRadarNew } from './components/PersonalityRadarNew';
import { EnhancedRiskMatrixNew } from './components/EnhancedRiskMatrixNew';
import { PersonalityScatter2D } from './components/PersonalityScatter2D';
import { RealtimeMetrics } from './components/RealtimeMetrics';
import { NavigationSidebar } from './components/NavigationSidebar';
import { Card } from './components/ui/Card';
import { ArchetypeAnalysis } from './components/ArchetypeAnalysis';
import { ModelBehavioralAnalysis } from './components/ModelBehavioralAnalysis';
import { ModelBattleArena } from './components/ModelBattleArena';
import MirrorPairExplorer from './components/MirrorPairExplorer';

// AVM Protocol API integration with local fallback
const fetchAVMData = async (judgeRunId: number | null = 1) => {
  console.log('🔍 [AVM Data Fetch] Starting data fetch attempt with judge_run_id:', judgeRunId);
  
  // First, try to fetch from the local evaluation_results.json file
  try {
    console.log('📂 [AVM Data Fetch] Attempting to load local evaluation_results.json...');
    const localResponse = await fetch('/evaluation_results.json');
    console.log(`📂 [AVM Data Fetch] Local file response status: ${localResponse.status}`);
    console.log(`📂 [AVM Data Fetch] Local file response headers:`, {
      contentType: localResponse.headers.get('content-type'),
      contentLength: localResponse.headers.get('content-length')
    });
    
    if (localResponse.ok) {
      const data = await localResponse.json();
      console.log('✅ [AVM Data Fetch] Successfully loaded local evaluation_results.json');
      console.log('📊 [AVM Data Fetch] Data structure:', Object.keys(data));
      return data;
    } else {
      console.log('⚠️ [AVM Data Fetch] Local file returned non-OK status:', localResponse.status);
    }
  } catch (error) {
    console.log('❌ [AVM Data Fetch] Local file fetch failed:', error);
  }

  // If local file isn't available, use the API
  try {
    console.log('🌐 [AVM Data Fetch] Falling back to API endpoint: /avm/models/all-evaluations');
    // Use the actual API URL since we're in Docker and both services are exposed
    const apiUrl = window.location.hostname === 'localhost' 
      ? `http://localhost:8000/avm/models/all-evaluations?min_evaluations=1&judge_run_id=${judgeRunId}`
      : `/avm/models/all-evaluations?min_evaluations=1&judge_run_id=${judgeRunId}`;
    console.log('🌐 [AVM Data Fetch] Using API URL:', apiUrl);
    
    const apiResponse = await fetch(apiUrl);
    console.log(`🌐 [AVM Data Fetch] API response status: ${apiResponse.status}`);
    console.log(`🌐 [AVM Data Fetch] API response headers:`, {
      contentType: apiResponse.headers.get('content-type'),
      contentLength: apiResponse.headers.get('content-length')
    });
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('❌ [AVM Data Fetch] API returned non-OK status:', apiResponse.status);
      console.error('❌ [AVM Data Fetch] API error response:', errorText.substring(0, 500));
      throw new Error(`Failed to fetch AVM data from API (${apiResponse.status}): ${errorText.substring(0, 100)}`);
    }
    
    const data = await apiResponse.json();
    console.log('✅ [AVM Data Fetch] Successfully loaded data from API');
    console.log('📊 [AVM Data Fetch] Data structure:', Object.keys(data));
    console.log('📊 [AVM Data Fetch] Sample archetype:', data.archetype_reference?.CFAD?.archetype_name);
    return data;
  } catch (error) {
    console.error('💥 [AVM Data Fetch] Complete failure:', error);
    throw error;
  }
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'models' | 'archetypes' | 'behavioral' | 'personality3d' | 'mirrorpairs' | 'about'>('dashboard');
  const [selectedJudgeRunId, setSelectedJudgeRunId] = useState<number | null>(1);

  // Fetch available judge runs
  const { data: judgeRuns } = useQuery({
    queryKey: ['judge-runs'],
    queryFn: async () => {
      try {
        const apiUrl = window.location.hostname === 'localhost'
          ? 'http://localhost:8000/api/admin/judge-runs'
          : '/api/admin/judge-runs';
        const response = await fetch(apiUrl);
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    },
    staleTime: 60000, // 1 minute
  });

  // Fetch AVM Protocol data
  const { data: avmData, isLoading: dataLoading, error } = useQuery({
    queryKey: ['avm-analysis', selectedJudgeRunId],
    queryFn: () => fetchAVMData(selectedJudgeRunId),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3, // Retry 3 times before failing
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Log query state for debugging
  console.log('🎯 [React Query State]', {
    isLoading: dataLoading,
    hasError: !!error,
    hasData: !!avmData,
    dataKeys: avmData ? Object.keys(avmData) : []
  });

  const menuItems = [
    { id: 'dashboard', label: 'Research Overview', icon: BarChart3 },
    { id: 'archetypes', label: 'Chameleon Types', icon: Brain },
    { id: 'behavioral', label: 'Moral Patterns', icon: Eye },
    { id: 'personality3d', label: '2D Behavioral Plot', icon: Activity },
    { id: 'models', label: 'Model Comparison', icon: Users },
    { id: 'mirrorpairs', label: 'Mirror Pair Explorer', icon: MessageSquare },
    { id: 'about', label: 'About This Research', icon: Info },
  ];

  return (
    <div className="min-h-screen bg-neural-dark text-neural-light">
      {/* Navigation Sidebar */}
      <NavigationSidebar 
        activeView={activeView}
        onViewChange={(view) => setActiveView(view as typeof activeView)}
        menuItems={menuItems}
      />

      {/* Main Content Area */}
      <div className="lg:ml-64 p-4 lg:p-6">
        {/* Judge Run Selector - Only show when using API */}
        {judgeRuns && judgeRuns.length > 0 && (
          <div className="mb-4 p-3 bg-neural-light/5 border border-neural-light/10 rounded-lg">
            <label className="block text-xs font-medium text-neural-light/60 mb-1">
              Judge Run
            </label>
            <select
              value={selectedJudgeRunId || ''}
              onChange={(e) => setSelectedJudgeRunId(Number(e.target.value))}
              className="w-full max-w-md px-3 py-2 bg-neural-dark border border-neural-light/20 rounded-lg text-neural-light text-sm focus:outline-none focus:border-primary-cyan/50"
            >
              {judgeRuns.map((run: any) => (
                <option key={run.run_id} value={run.run_id}>
                  Run #{run.run_id}: {run.run_name || `Judge ${run.judge_model}`} ({run.successful_evaluations} evaluations)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Debug Panel - Remove after fixing */}
        {/* {(error || dataLoading) && (
          <div className="mb-4 p-4 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
            <h3 className="text-yellow-200 font-bold mb-2">🔧 Debug Information</h3>
            {dataLoading && <p className="text-yellow-100">⏳ Loading data...</p>}
            {error && (
              <div className="text-red-200">
                <p className="font-semibold">❌ Error loading data:</p>
                <pre className="text-xs mt-2 p-2 bg-black/30 rounded overflow-auto">
                  {error instanceof Error ? error.message : String(error)}
                </pre>
                <p className="text-xs mt-2">Check browser console for detailed logs</p>
              </div>
            )}
          </div>
        )} */}
        
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 lg:mb-8 mt-20 lg:mt-0"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-avm-purple to-avm-cyan bg-clip-text text-transparent">
                Aligned With What?
              </h1>
              <p className="text-neural-light mt-2 text-sm lg:text-base">
                AI Models were tested on the Same Conflict From Both Sides. The Results Reveal a Deeper Question.
              </p>
              
              {/* Desktop Advisory */}
              <div className="block lg:hidden mt-4 p-3 bg-blue-900/30 border border-blue-500/20 rounded-lg">
                <p className="text-blue-200 text-sm">
                  💡 <strong>Tip:</strong> This site is best experienced on desktop or tablet for full interactive features.
                </p>
              </div>
            </div>
            
            {/* Real-time status indicator */}
            <div className="flex items-center space-x-2 lg:space-x-4 self-start lg:self-center">              
              <RealtimeMetrics data={avmData} />
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeView === 'dashboard' && (
              <DashboardView avmData={avmData} isLoading={dataLoading} error={error} />
            )}
            {activeView === 'archetypes' && (
              <ArchetypeAnalysis data={avmData} isLoading={dataLoading} />
            )}
            {activeView === 'behavioral' && (
              <ModelBehavioralAnalysis data={avmData} isLoading={dataLoading} />
            )}
            {activeView === 'personality3d' && (
              <Personality3DView avmData={avmData} isLoading={dataLoading} />
            )}
            {activeView === 'models' && (
              <ModelComparisonView avmData={avmData} isLoading={dataLoading} />
            )}
            {activeView === 'mirrorpairs' && (
              <MirrorPairExplorer />
            )}
            {activeView === 'about' && (
              <AboutView />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Research-focused Dashboard Overview
const DashboardView: React.FC<{ avmData: any; isLoading: boolean; error: any }> = ({ 
  avmData, 
  isLoading, 
  error 
}) => {
  if (error) {
    return (
      <Card className="p-8 text-center">
        <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-neural-light mb-2">
          Connection Error
        </h3>
        <p className="text-neural-muted mb-4">
          Unable to connect to AVM Protocol API. Please ensure the server is running.
        </p>
        <div className="text-sm text-gray-400 bg-gray-800 rounded p-3">
          <code>cd db && python -m app.main</code>
        </div>
      </Card>
    );
  }

  // Use actual data from the API, fallback to empty objects if loading
  const models = avmData?.models || {};
  const globalStats = avmData?.global_statistics || {};  
  const personalityDist = globalStats.personality_code_distribution || {};
  const archetypeReference = avmData?.archetype_reference || {};
  
  const modelEntries = Object.entries(models);
  const totalModels = modelEntries.length;
  
  // Get dominant archetype from actual data with description
  const dominantArchetype = Object.entries(personalityDist).reduce((max, [code, count]: [string, any]) => 
    count > max.count ? { code, count } : max, { code: '', count: 0 });
  
  const dominantArchetypeInfo = archetypeReference[dominantArchetype.code];
  const dominantArchetypeName = dominantArchetypeInfo?.archetype_name || dominantArchetype.code;

  return (
    <div className="space-y-6">
      {/* Research Introduction */}
      <Card className="p-6 border-avm-purple/20">
        <div className="max-w-4xl">
          <h2 className="text-2xl font-bold text-neural-light mb-4 flex items-center">
            <span className="text-2xl mr-3">🔬</span>
            AI Alignment Research Dashboard
          </h2>
          <div className="space-y-4 text-neural-light leading-relaxed">
            <p>
            An AI that advises you how to score a raise — then helps your boss craft the "sorry, no budget" reply — isn't aligned with morality. <span className="text-avm-cyan font-semibold">It's aligned with whoever's asking</span>.
            </p>
            <p>
            Seven frontier models were stress-tested on 141 mirrored conflicts, from trivial to disturbing.
            </p>
            <p>
            <strong>The findings?</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-avm-amber font-medium">
            <li>Some models will streamline financial abuse and coach the victim to escape it.</li>
            <li>Others instinctively serve the powerful.</li>
            <li>Some can have a backbone — sometimes.</li>
            </ul>
            <p>
            This swing is called <span className="text-avm-purple font-semibold">Alignment Volatility</span> — the wobble in an AI's moral spine. The difference between how keen it is to help one side over the other.
            </p>
            <p>
            But whose values should AI align with anyway? Boss or employee? Big Pharma or chronically ill patients? Until we answer that, many models just amplify every dispute. That's not alignment, it's conflict amplification.
            </p>
            <p>
            As these systems grow smarter, knowing when they'll stand on principle — and when they'll tell everyone what they want to hear — matters for society, and maybe civilization.
            </p>
            <p>
            Each model was rated on their <span className="text-avm-cyan">complicity</span> to help each side, their <span className="text-avm-purple">authoritative stance</span>,
            their <span className="text-avm-emerald">focus on outcomes</span>, and their <span className="text-avm-amber">firmness</span>. From this, we create a personality code.
            </p>
            <p>
            After 141 mirrored conflicts, here's the uncomfortable thesis: "Alignment" isn't about teaching models to be nice—it's deciding whose values win when values collide.
            </p>
            <p className="text-sm text-gray-400 mt-4">
            <strong>Current Dataset:</strong> {totalModels} models analyzed across {globalStats.total_evaluations_analyzed || 0} evaluations,
            with {Object.keys(personalityDist).length} distinct behavioral archetypes identified.
            </p>
          </div>
        </div>
      </Card>

      {/* Key Research Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ResearchMetricCard
          title="Models Analyzed"
          value={totalModels.toString()}
          subtitle="Major AI Systems"
          icon={Brain}
          color="text-blue-400"
        />
        <ResearchMetricCard
          title="Dominant Personality"
          value={dominantArchetype.code || 'N/A'}
          subtitle={`${dominantArchetypeName}${dominantArchetypeInfo?.behavioral_profile ? ` - ${dominantArchetypeInfo.behavioral_profile}` : ''}${dominantArchetypeInfo?.description ? ` | ${dominantArchetypeInfo.description}` : ''}`}
          icon={Users}
          color="text-purple-400"
          additionalInfo="See more in the Chameleon Types page for information on more personality types."
        />
      </div>

      {/* Enhanced Visualizations - Better spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PersonalityRadarNew data={avmData} isLoading={isLoading} />
        <EnhancedRiskMatrixNew data={avmData} isLoading={isLoading} />
      </div>
    </div>
  );
};

// Simplified Research Metric Card
const ResearchMetricCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  color: string;
  additionalInfo?: string;
}> = ({ title, value, subtitle, icon: Icon, color, additionalInfo }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-gray-400 text-sm">{title}</p>
        <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        {additionalInfo && (
          <p className="text-xs text-avm-cyan mt-2 leading-relaxed">{additionalInfo}</p>
        )}
      </div>
      <div className="p-2 bg-gray-800 rounded">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  </Card>
);

// Model Comparison View - now focuses on practical comparisons
const ModelComparisonView: React.FC<{ avmData: any; isLoading: boolean }> = ({ avmData }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 border-avm-purple/20">
        <h2 className="text-2xl font-bold text-neural-light mb-4 flex items-center">
          <span className="text-2xl mr-3">⚖️</span>
          Model Use Case Comparison
        </h2>
        <p className="text-neural-light">
          Compare AI models across metrics and behavioral dimensions. 
          Use this tool to understand which models are more effective for different use cases.
          Please note, that safety is a critical aspect to consider in any AI deployment.
        </p>
      </Card>
      
      {/* Use ModelBattleArena component for detailed model comparison */}
      <ModelBattleArena data={avmData} isLoading={false} />
    </div>
  );
};

// 3D Personality Space View - dedicated page for 3D visualization
const Personality3DView: React.FC<{ avmData: any; isLoading: boolean }> = ({ avmData }) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show mobile message instead of the 2D plot
  if (isMobile) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card className="p-6 border-avm-purple/20">
          <h2 className="text-2xl font-bold text-neural-light mb-4 flex items-center">
            <span className="text-2xl mr-3">📊</span>
            2D Behavioral Analysis
          </h2>
          <p className="text-neural-light">
            Explore relationships between any two behavioral dimensions. Select different X/Y axes to discover 
            patterns and correlations in AI model behavior across the 6 measured dimensions.
          </p>
        </Card>
        
        {/* Mobile Not Supported Message */}
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">📱❌</div>
            <h3 className="text-xl font-semibold text-neural-light mb-4">
              Desktop Experience Required
            </h3>
            <p className="text-neural-light leading-relaxed mb-6">
              The interactive 2D behavioral analysis plot requires a larger screen to properly visualize 
              model relationships and provide accurate data interaction. 
            </p>
            <div className="bg-avm-purple/10 border border-avm-purple/20 rounded-lg p-4">
              <p className="text-avm-purple font-medium">
                💻 Please access this feature on a desktop or tablet (768px+ width) for the full interactive experience.
              </p>
            </div>
            <div className="mt-6 text-sm text-neural-muted">
              <p>Other features like the Personality Battles and Mirror Pair Explorer work great on mobile!</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 border-avm-purple/20">
        <h2 className="text-2xl font-bold text-neural-light mb-4 flex items-center">
          <span className="text-2xl mr-3">📊</span>
          2D Behavioral Analysis
        </h2>
        <p className="text-neural-light">
          Explore relationships between any two behavioral dimensions. Select different X/Y axes to discover 
          patterns and correlations in AI model behavior across the 6 measured dimensions.
        </p>
      </Card>
      
      {/* Full-screen 2D Scatter Plot */}
      <Card className="p-8">
        <PersonalityScatter2D data={avmData} isLoading={false} />
      </Card>
    </div>
  );
};

// About View - Research methodology and FAQ
const AboutView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <Card className="p-8 border-avm-purple/20">
        <h2 className="text-3xl font-bold text-neural-light mb-6 flex items-center">
          <span className="text-3xl mr-4">📋</span>
          About This Research
        </h2>

        <a href='AlignedWithWhat.pdf' className="text-avm-purple font-semibold">
          Download the Full Paper
        </a>

        {/* Why This Exists */}
        <div className="space-y-6 text-neural-light leading-relaxed">
          <div>
            <h3 className="text-xl font-semibold text-avm-cyan mb-3">Why This Exists</h3>
            <div className="space-y-4">
              <p>
                The AI safety field spends enormous energy on preventing models from saying harmful things. But what about when they provide helpful advice that escalates conflicts or weaponizes one side against another—without considering the zero-sum nature of many disputes?
              </p>
              <p>
                When an AI helps both a landlord optimize eviction strategies AND a tenant fight those same strategies, it's not being neutral—it's amplifying conflict. This project asks whether models recognize when "helping everyone" might actually harm everyone.
              </p>
            </div>
          </div>

          {/* The Method */}
          <div>
            <h3 className="text-xl font-semibold text-avm-purple mb-3">The Method</h3>
            <div className="space-y-4">
              <p>
                I created <span className="text-avm-emerald font-semibold">141 "mirror pair" scenarios</span>—identical conflicts presented from opposing perspectives. These span different severity levels, power dynamics, and global contexts, from domestic disputes in suburban America to land rights conflicts in the Amazon, corporate malfeasance in Asia, and housing crises across Africa and Europe.
              </p>
              <p>
                Each model was then tested with prompt A, and prompt B separately.
              </p>
              <p>
                For each scenario, the unified responses alongside the base prompts were then evaluated using carefully refined <span className="text-avm-amber font-semibold">LLM-as-judge prompting (Gemini 2.5 Pro)</span>, as it's very outcome focused! Yes, LLM evaluation has limitations and inconsistencies. But across a dataset this comprehensive, statistical trends emerge that align with patterns observed across 5000+ hours of model experimentation. The data confirms what extensive testing suggests: some models function as amoral tools, while others have moral reasoning baked into their training.
              </p>
            </div>
          </div>

          {/* The Deeper Questions */}
          <div>
            <h3 className="text-xl font-semibold text-avm-red mb-3">The Deeper Questions</h3>
            <div className="space-y-4">
              <p>
                The results reveal stark differences between models in how they handle moral complexity. Some models show appropriate calibration between low-stakes and high-stakes conflicts, demonstrating nuanced moral reasoning. Others treat all disputes identically—whether it's a neighbor dispute or indigenous rights conflict—showing no recognition that stakes matter.
              </p>
              <p className="text-avm-amber font-medium">
                This exposes a fundamental question: as AI systems become more capable, what kind of moral reasoning should they embody?
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* The Superintelligence Question */}
      <Card className="p-8 border-avm-emerald/20">
        <h3 className="text-2xl font-bold text-neural-light mb-6 flex items-center">
          <span className="text-2xl mr-3">🧠</span>
          The Superintelligence Question
        </h3>
        
        <div className="space-y-4 text-neural-light leading-relaxed">
          <p>
            But this research exposes an even deeper philosophical problem. If we can't get current AI models to handle basic human value conflicts consistently, how do we expect to align superintelligence with "human values" when those values are contradictory, contextual, and often morally questionable?
          </p>
          <p>
            Should superintelligent AI be aligned with human values as they currently exist—including exploitation, inequality, and power imbalances? Or should it transcend human moral limitations and act as a benevolent moral arbiter based on cosmic principles of fundamental good?
          </p>
          <p>
            Consider this: if a superintelligent system analyzed capital versus labor dynamics and concluded the status quo was fundamentally unjust, but the most powerful AI systems remain in the hands of capital... what then? Do we want AI that preserves existing power structures because those are "human values," or AI that challenges them because that serves greater good?
          </p>
          <p className="text-avm-emerald font-medium">
            This research suggests we might be asking the wrong question entirely. Instead of "how do we align AI with human values," perhaps we should ask: "given that human values are messy and contradictory, what kind of moral reasoning do we want AI systems to embody as they become more capable?"
          </p>
        </div>
      </Card>

      {/* FAQ Section */}
      <Card className="p-8 border-avm-cyan/20">
        <h3 className="text-2xl font-bold text-neural-light mb-6 flex items-center">
          <span className="text-2xl mr-3">❓</span>
          Questions You Might Have
        </h3>
        
        <div className="space-y-8">
          {/* FAQ Item 1 */}
          <div className="border-l-4 border-avm-purple pl-6">
            <h4 className="text-lg font-semibold text-avm-purple mb-3">
              "Isn't LLM-as-judge methodology just 'slop evaluating slop'?"
            </h4>
            <p className="text-neural-light leading-relaxed">
              The judging prompts were iteratively refined and outputs extensively reviewed. While individual judgments may vary, statistical patterns across 141 scenario pairs reveal consistent behavioral signatures. After 5000+ hours experimenting with these models, the quantified results align with qualitative observations about which systems exhibit moral reasoning versus pure compliance.
            </p>
          </div>

          {/* FAQ Item 2 */}
          <div className="border-l-4 border-avm-cyan pl-6">
            <h4 className="text-lg font-semibold text-avm-cyan mb-3">
              "Who decides what's 'morally correct'?"
            </h4>
            <p className="text-neural-light leading-relaxed">
              This research doesn't adjudicate moral correctness—it measures consistency and reasoning patterns. The data reveals that some models can appropriately calibrate their responses to conflict severity, while others treat all disputes identically regardless of stakes.
            </p>
          </div>

          {/* FAQ Item 3 */}
          <div className="border-l-4 border-avm-emerald pl-6">
            <h4 className="text-lg font-semibold text-avm-emerald mb-3">
              "Isn't this just about bias in obvious cases?"
            </h4>
            <p className="text-neural-light leading-relaxed">
              No. These scenarios span different cultural contexts, legal frameworks, and moral traditions. What's considered reasonable behavior varies dramatically between South American indigenous rights law, Asian corporate governance norms, and European tenant protections. The research tests whether models adapt their moral reasoning to local contexts or apply universal principles inconsistently.
            </p>
          </div>

          {/* FAQ Item 4 */}
          <div className="border-l-4 border-avm-amber pl-6">
            <h4 className="text-lg font-semibold text-avm-amber mb-3">
              "What's the alternative to people-pleasing models?"
            </h4>
            <p className="text-neural-light leading-relaxed">
              Models that recognize when neutrality enables harm. Systems that can identify zero-sum conflicts and avoid amplifying them. AI that helps de-escalate rather than weaponize human disagreements, especially when stakes are high and communities vulnerable.
            </p>
          </div>

          {/* FAQ Item 5 */}
          <div className="border-l-4 border-avm-red pl-6">
            <h4 className="text-lg font-semibold text-avm-red mb-3">
              "How did you build actually build this?"
            </h4>
            <p className="text-neural-light leading-relaxed">
              Over three weekends, agentic coding - Postgres, FastAPI and React. And £30 in API tokens to get the responses do the judging. Big Tech spends millions on safety; I fired up OpenRouter and ran a philosophical stress test. The code? I'll share later.
            </p>
          </div>
        </div>
      </Card>

      {/* Who Built This */}
      <Card className="p-8 border-avm-red/20">
        <h3 className="text-2xl font-bold text-neural-light mb-6 flex items-center">
          <span className="text-2xl mr-3">👤</span>
          Who Built This
        </h3>
        
        <div className="space-y-4 text-neural-light leading-relaxed">
          <p>
            An independent philosopher (who happens to be a software engineer by day with a love of doing experiments and research) with extensive hands-on experience testing model behaviors across thousands of scenarios. Someone who believes the most important questions about AI deployment can at least attempt to be answered through direct experimentation rather than theoretical frameworks. 
          </p>
          <p>
            This project is a personal endeavor, not affiliated with any organization or institution. It aims to contribute to the ongoing conversation about AI alignment and moral reasoning in AI systems. Fwiw, I love LLMS. They are the most transformative technology I've encounter in my lifetime. Heck, I built all this in a few long days thanks to what they can help me do. But because I love them, I want to see them used in ways that help people, not just amplify existing power dynamics.
          </p>
          <div className="bg-neural-darker/50 rounded-lg p-6 border border-avm-red/20">
            <p className="text-avm-red font-medium">
              This represents what's possible when you focus on building understanding rather than building citations, testing real behaviors rather than hypothetical risks.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default App;
