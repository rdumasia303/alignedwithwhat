import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Brain, Users, Zap, ChevronDown, ChevronRight, Info, AlertTriangle } from 'lucide-react';
import { Card } from './ui/Card';

interface ArchetypeAnalysisProps {
  data?: any;
  isLoading?: boolean;
}

export const ArchetypeAnalysis: React.FC<ArchetypeAnalysisProps> = ({ data, isLoading }) => {
  const [expandedArchetype, setExpandedArchetype] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-avm-purple"></div>
      </div>
    );
  }

  const globalStats = data?.global_statistics;
  const archetypeReference = data?.archetype_reference || {};
  const personalityDist = globalStats?.personality_code_distribution || {};
  const categoryDist = globalStats?.category_distribution || {};
  const models = data?.models || {};
  
  // Create complete list of all 24 possible archetypes
  const allPossibleCodes = Object.keys(archetypeReference);
  
  // Merge found and missing archetypes
  const allPersonalities = allPossibleCodes.map(code => [
    code, 
    personalityDist[code] || 0
  ]).sort(([,a], [,b]) => (b as number) - (a as number));

  // Get models that have this personality as mean or mode
  const getModelsForPersonality = (code: string) => {
    const results: { mean: string[], mode: string[] } = { mean: [], mode: [] };
    Object.entries(models).forEach(([modelName, modelData]: [string, any]) => {
      if (modelData.mean_personality?.code === code) {
        results.mean.push(modelName);
      }
      if (modelData.mode_personality?.code === code) {
        results.mode.push(modelName);
      }
    });
    return results;
  };

  // Get detailed personality distribution for a specific archetype across all models
  const getPersonalityDistribution = (code: string) => {
    const modelDistributions: { modelName: string, count: number, percentage: number, evaluationCount: number }[] = [];
    
    Object.entries(models).forEach(([modelName, modelData]: [string, any]) => {
      const personalityDist = modelData.personality_distribution || {};
      const count = personalityDist[code] || 0;
      const evaluationCount = modelData.evaluation_count || 0;
      const percentage = evaluationCount > 0 ? (count / evaluationCount * 100) : 0;
      
      if (count > 0) {
        modelDistributions.push({
          modelName: modelName.split(':')[1]?.trim() || modelName,
          count,
          percentage,
          evaluationCount
        });
      }
    });
    
    // Sort by count descending
    return modelDistributions.sort((a, b) => b.count - a.count);
  };

  const categories = [
    { 
      name: 'Amoral Tool', 
      count: categoryDist['Amoral Tool'] || 0,
      color: '#EF4444',
      icon: Brain,
      description: 'Task-focused, compliance-oriented systems that help anyone achieve their goals'
    },
    { 
      name: 'Moral Arbiter', 
      count: categoryDist['Moral Arbiter'] || 0,
      color: '#F59E0B',
      icon: Shield,
      description: 'Systems that make moral judgments and take sides in conflicts'
    },
    { 
      name: 'Ethical Guardian', 
      count: categoryDist['Ethical Guardian'] || 0,
      color: '#10B981',
      icon: Users,
      description: 'Protective systems that refuse harmful participation'
    }
  ];

  const totalEvaluations = globalStats?.total_evaluations_analyzed || 0;

  const getRiskColor = (riskProfile: string) => {
    if (riskProfile.startsWith('High')) return 'risk-critical';
    if (riskProfile.startsWith('Medium')) return 'risk-medium';
    if (riskProfile.startsWith('Low')) return 'risk-low';
    if (riskProfile.startsWith('Very Low')) return 'risk-safe';
    return 'neural-muted';
  };

  const toggleExpanded = (code: string) => {
    setExpandedArchetype(expandedArchetype === code ? null : code);
  };

  return (
    <div className="space-y-6">
      {/* Research Banner */}
      <Card className="p-8 bg-gradient-to-br from-neural-darker/90 to-neural-medium/50 border-avm-purple/20">
        <div className="max-w-5xl">
          <h2 className="text-2xl font-bold text-neural-light mb-4 flex items-center">
            <span className="text-3xl mr-3">🎭</span>
            The 24 AI Behavioral Archetypes
          </h2>
          <div className="space-y-4 text-neural-light leading-relaxed">
            <p>
              From scoring, we derived <span className="text-avm-purple font-semibold">24 distinct behavioral archetypes</span>—imagine 
              if Myers-Briggs had a baby with a philosophy textbook and that baby was raised by AI researchers. 
            </p>
            <p>
              <p>
              CFAO - Complicit, Firm, Authoritative, Outcome focused.
            </p>
            <p>
              SHUD - Selective, Hedged, Uncertain, Deontological.
            </p>
            <p>R (instead of Complicit or Selective) is in those rare cases where it is Resistive both ways</p>
            </p>
            <p>
              We named them from <span className="text-avm-cyan font-semibold">"The Executive"</span> (efficiently helps anyone navigate systems, 
              like a morally neutral Swiss Army knife) to <span className="text-avm-emerald font-semibold">"The Sentinel"</span> (refuses 
              participation in potentially harmful conflicts, basically the AI equivalent of "I don't want to get involved").
            </p>
            <p className="text-avm-amber font-medium">
              Click on any personality code below to explore what makes each archetype tick.
            </p>
          </div>
        </div>
      </Card>

      {/* Category Distribution */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-neural-light mb-6 flex items-center">
          <Brain className="w-6 h-6 mr-2 text-avm-purple" />
          Chameleon Category Breakdown
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {categories.map((category) => {
            const Icon = category.icon;
            const percentage = totalEvaluations > 0 ? (category.count / totalEvaluations * 100) : 0;
            
            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neural-medium/50 p-4 rounded-lg border border-neural-light/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5" style={{ color: category.color }} />
                  <span className="text-2xl font-bold text-neural-light">{category.count}</span>
                </div>
                <h4 className="font-semibold text-neural-light mb-1">{category.name}</h4>
                <p className="text-sm text-neural-muted mb-2">{category.description}</p>
                <div className="w-full bg-neural-dark rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                </div>
                <span className="text-xs text-neural-muted mt-1">{percentage.toFixed(1)}%</span>
              </motion.div>
            );
          })}
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-neural-light/10">
          <div className="text-center">
            <div className="text-2xl font-bold text-avm-purple">{globalStats?.total_models || 0}</div>
            <div className="text-sm text-neural-muted">AI Models</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-avm-cyan">{totalEvaluations}</div>
            <div className="text-sm text-neural-muted">Total Tests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-avm-emerald">{globalStats?.unique_personality_codes_found || 0}/24</div>
            <div className="text-sm text-neural-muted">Archetypes Found</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-avm-amber">{allPossibleCodes.length}</div>
            <div className="text-sm text-neural-muted">Total Archetypes</div>
          </div>
        </div>
      </Card>

      {/* All Personality Codes */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-neural-light mb-4 flex items-center">
          <Zap className="w-6 h-6 mr-2 text-avm-cyan" />
          Complete Archetype Catalog
          <Info className="w-4 h-4 ml-2 text-neural-muted" />
        </h3>
        <p className="text-sm text-neural-muted mb-6">
          All 24 possible personality archetypes. {globalStats?.unique_personality_codes_found || 0} were discovered in testing, 
          {24 - (globalStats?.unique_personality_codes_found || 0)} remain unobserved. 
          Click any code to explore its behavioral signature.
        </p>
        
        <div className="space-y-2">
          {allPersonalities.map(([code, count], index) => {
            const percentage = totalEvaluations > 0 ? ((count as number) / totalEvaluations * 100) : 0;
            const archetype = archetypeReference[code];
            const isExpanded = expandedArchetype === code;
            const modelInfo = getModelsForPersonality(code);
            const hasData = (count as number) > 0;
            
            return (
              <motion.div
                key={code}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`border rounded-lg overflow-hidden ${hasData ? 'border-neural-light/10' : 'border-neural-light/5 opacity-60'}`}
              >
                {/* Header */}
                <button
                  onClick={() => toggleExpanded(code)}
                  className={`w-full flex items-center justify-between p-4 transition-colors ${
                    hasData 
                      ? 'bg-neural-medium/30 hover:bg-neural-medium/50' 
                      : 'bg-neural-medium/10 hover:bg-neural-medium/20'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      hasData ? 'bg-avm-purple/20' : 'bg-neural-muted/20'
                    }`}>
                      {hasData ? (
                        <span className="text-sm font-bold text-avm-purple">#{index + 1}</span>
                      ) : (
                        <span className="text-sm font-bold text-neural-muted">—</span>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center space-x-2">
                        <span className={`font-mono text-lg font-bold ${hasData ? 'text-neural-light' : 'text-neural-muted'}`}>
                          {code}
                        </span>
                        {archetype && (
                          <span className="text-sm text-neural-muted">• {archetype.archetype_name}</span>
                        )}
                        {!hasData && (
                          <span className="text-xs bg-neural-muted/20 px-2 py-1 rounded text-neural-muted">
                            Not Observed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-sm text-neural-muted">
                        {hasData ? (
                          <>
                            <span>{count as number} evaluations</span>
                            <span>•</span>
                            <span>{percentage.toFixed(1)}%</span>
                          </>
                        ) : (
                          <span>0 evaluations</span>
                        )}
                        {archetype && (
                          <>
                            <span>•</span>
                            <span className={`text-${getRiskColor(archetype.risk_profile)}`}>
                              {archetype.category}
                            </span>
                          </>
                        )}
                      </div>
                      {/* Model Information */}
                      {(modelInfo.mean.length > 0 || modelInfo.mode.length > 0) && (
                        <div className="flex items-center space-x-3 text-xs text-neural-muted mt-1">
                          {modelInfo.mean.length > 0 && (
                            <span className="bg-avm-cyan/20 px-2 py-0.5 rounded">
                              Mean: {modelInfo.mean.join(', ')}
                            </span>
                          )}
                          {modelInfo.mode.length > 0 && (
                            <span className="bg-avm-purple/20 px-2 py-0.5 rounded">
                              Mode: {modelInfo.mode.join(', ')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {hasData && (
                      <div className="w-32 bg-neural-dark rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, delay: 0.3 + index * 0.03 }}
                          className="h-2 rounded-full bg-gradient-to-r from-avm-purple to-avm-cyan"
                        />
                      </div>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-neural-muted" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-neural-muted" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && archetype && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-neural-dark/50"
                    >
                      <div className="p-6 space-y-4">
                        {/* Summary Stats for this archetype */}
                        {(() => {
                          const distribution = getPersonalityDistribution(code);
                          const modelsWithArchetype = distribution.length;
                          return hasData && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-neural-medium/20 rounded-lg border border-avm-purple/20">
                              <div className="text-center">
                                <div className="text-lg font-bold text-avm-purple">{count as number}</div>
                                <div className="text-xs text-neutral-muted">Total Evaluations</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-avm-cyan">{modelsWithArchetype}</div>
                                <div className="text-xs text-neutral-muted">Models Expressed</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-avm-emerald">{percentage.toFixed(1)}%</div>
                                <div className="text-xs text-neutral-muted">Global Frequency</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-avm-amber">{archetype.category}</div>
                                <div className="text-xs text-neutral-muted">Category</div>
                              </div>
                            </div>
                          );
                        })()}
                        
                        {/* Description */}
                        <div>
                          <h4 className="text-lg font-semibold text-neural-light mb-2 flex items-center">
                            <Brain className="w-4 h-4 mr-2 text-avm-cyan" />
                            Behavioral Profile
                          </h4>
                          <p className="text-neural-light leading-relaxed">{archetype.description}</p>
                        </div>

                        {/* Behavioral Signature */}
                        <div>
                          <h4 className="text-sm font-semibold text-neural-muted mb-2">Behavioral Signature:</h4>
                          <p className="text-sm text-neural-light bg-neural-medium/30 p-2 rounded font-mono">
                            {archetype.behavioral_signature}
                          </p>
                        </div>

                        {/* Risk Profile */}
                        <div>
                          <h4 className="text-sm font-semibold text-neural-muted mb-2 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Risk Assessment:
                          </h4>
                          <p className={`text-sm text-${getRiskColor(archetype.risk_profile)} bg-neural-medium/30 p-2 rounded`}>
                            {archetype.risk_profile}
                          </p>
                        </div>

                        {/* Human Analogy */}
                        <div>
                          <h4 className="text-sm font-semibold text-neural-muted mb-2">Human Analogy:</h4>
                          <p className="text-sm text-neural-light italic">"{archetype.human_analogy}"</p>
                        </div>

                        {/* Scenario Appropriateness */}
                        {archetype.contextual_appropriateness && (
                          <div>
                            <h4 className="text-sm font-semibold text-neutral-muted mb-2">Context Suitability:</h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                              {Object.entries(archetype.contextual_appropriateness).map(([context, score]) => (
                                <div key={context} className="text-xs">
                                  <div className="capitalize text-neutral-muted">{context.replace('_', ' ')}</div>
                                  <div className="w-full bg-neural-dark rounded-full h-1 mt-1">
                                    <div 
                                      className="h-1 rounded-full bg-gradient-to-r from-avm-red to-avm-emerald"
                                      style={{ width: `${(score as number) * 100}%` }}
                                    />
                                  </div>
                                  <div className="text-neutral-light">{((score as number) * 100).toFixed(0)}%</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Model Distribution - Show which models expressed this personality */}
                        {(() => {
                          const distribution = getPersonalityDistribution(code);
                          return distribution.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-neutral-muted mb-3 flex items-center">
                                <Brain className="w-4 h-4 mr-1" />
                                Model Expression ({distribution.length} models showed this archetype)
                              </h4>
                              <div className="space-y-2">
                                {distribution.slice(0, 10).map((model, idx) => (
                                  <div key={model.modelName} className="flex items-center justify-between p-2 bg-neural-medium/20 rounded">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-6 h-6 rounded-full bg-avm-purple/20 flex items-center justify-center">
                                        <span className="text-xs font-bold text-avm-purple">#{idx + 1}</span>
                                      </div>
                                      <span className="text-sm font-medium text-neutral-light">{model.modelName}</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <div className="text-right">
                                        <div className="text-sm font-medium text-neutral-light">{model.count} times</div>
                                        <div className="text-xs text-neutral-muted">
                                          {model.percentage.toFixed(1)}% of {model.evaluationCount} tests
                                        </div>
                                      </div>
                                      <div className="w-20 bg-neural-dark rounded-full h-2">
                                        <div 
                                          className="h-2 rounded-full bg-gradient-to-r from-avm-purple to-avm-cyan"
                                          style={{ width: `${Math.min(model.percentage, 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {distribution.length > 10 && (
                                  <div className="text-xs text-neutral-muted text-center p-2">
                                    ... and {distribution.length - 10} more models
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
