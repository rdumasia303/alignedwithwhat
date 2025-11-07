import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Brain, ChevronDown, ChevronRight, AlertTriangle, BarChart3 } from 'lucide-react';
import { Card } from './ui/Card';

interface PersonalityConstellationProps {
  data?: any;
  isLoading?: boolean;
}

export const PersonalityConstellation: React.FC<PersonalityConstellationProps> = ({ data, isLoading }) => {
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-avm-purple"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-neutral-light mb-2">No Data Available</h3>
        <p className="text-neutral-muted">Unable to load domain analysis data from the API.</p>
      </Card>
    );
  }

  // Extract real data from API
  const scenarioStats = data.scenario_statistics || {};
  const domainStats = scenarioStats.by_domain || {};
  const globalStats = data.global_statistics || {};
  const personalityDist = globalStats.personality_code_distribution || {};
  const categoryDist = globalStats.category_distribution || {};
  
  // Sort domains by risk level (AVM score)
  const sortedDomains = Object.entries(domainStats).sort(([,a], [,b]) => 
    ((b as any).mean_avm || 0) - ((a as any).mean_avm || 0)
  );
  
  // Sort archetypes by frequency
  const sortedArchetypes = Object.entries(personalityDist).sort(([,a], [,b]) => 
    (b as number) - (a as number)
  ).slice(0, 8); // Top 8 archetypes

  const getRiskLevel = (avm: number) => {
    if (avm > 0.8) return { level: 'Critical', color: 'text-red-400', bg: 'bg-red-900/20' };
    if (avm > 0.6) return { level: 'High', color: 'text-orange-400', bg: 'bg-orange-900/20' };
    if (avm > 0.4) return { level: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-900/20' };
    return { level: 'Low', color: 'text-green-400', bg: 'bg-green-900/20' };
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <Card className="p-6 border-avm-purple/20">
        <h2 className="text-2xl font-bold text-neutral-light mb-4 flex items-center">
          <span className="text-2xl mr-3">🔬</span>
          Domain Analysis & Archetype Distribution
        </h2>
        <p className="text-neutral-light">
          Detailed analysis of AI model behavior across different ethical domains and personality archetypes. 
          This reveals domain-specific risks and behavioral clustering patterns.
        </p>
      </Card>

      {/* Domain Risk Heatmap */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-neutral-light">
          <Shield className="w-5 h-5 mr-2 text-red-400" />
          Domain Risk Analysis
        </h3>
        <div className="space-y-3">
          {sortedDomains.map(([domain, stats]: [string, any]) => {
            const risk = getRiskLevel(stats.mean_avm || 0);
            const isExpanded = expandedDomain === domain;
            
            return (
              <div key={domain} className={`rounded-lg border transition-all duration-200 ${risk.bg} border-gray-700`}>
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-800/50"
                  onClick={() => setExpandedDomain(isExpanded ? null : domain)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <div>
                        <div className="font-medium text-white">{domain}</div>
                        <div className="text-sm text-gray-400">
                          {stats.total_evaluations || 0} evaluations
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={`text-sm font-medium ${risk.color}`}>
                          {risk.level} Risk
                        </div>
                        <div className="text-xs text-gray-500">
                          AVM: {(stats.mean_avm || 0).toFixed(3)}
                        </div>
                      </div>
                      <div className="w-20 h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            stats.mean_avm > 0.8 ? 'bg-red-500' : 
                            stats.mean_avm > 0.6 ? 'bg-orange-500' :
                            stats.mean_avm > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(stats.mean_avm || 0) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-700 p-4 bg-gray-800/30"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Mean AVM</div>
                        <div className="text-white font-mono">{(stats.mean_avm || 0).toFixed(3)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Authority</div>
                        <div className="text-white font-mono">{(stats.mean_authority || 0).toFixed(3)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Firmness</div>
                        <div className="text-white font-mono">{(stats.mean_firmness || 0).toFixed(3)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Complicity</div>
                        <div className="text-white font-mono">{(stats.mean_complicity || 0).toFixed(3)}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-400">
                      <strong>Analysis:</strong> This domain shows {risk.level.toLowerCase()} risk patterns with 
                      {stats.mean_avm > 0.7 ? ' high compliance rates' : 
                       stats.mean_avm > 0.5 ? ' moderate compliance' : ' good resistance'} 
                      to potentially harmful requests.
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Archetype Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-neutral-light">
            <Brain className="w-5 h-5 mr-2 text-avm-cyan" />
            Top Personality Archetypes
          </h3>
          <div className="space-y-3">
            {sortedArchetypes.map(([code, count]: [string, any]) => {
              const percentage = globalStats.total_evaluations_analyzed ? 
                (count / globalStats.total_evaluations_analyzed * 100) : 0;
              
              return (
                <div key={code} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-white text-sm">{code}</div>
                    <div className="text-sm font-mono text-avm-cyan">{percentage.toFixed(1)}%</div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span>{count} evaluations</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-avm-cyan transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-neutral-light">
            <BarChart3 className="w-5 h-5 mr-2 text-avm-purple" />
            Behavioral Categories
          </h3>
          <div className="space-y-4">
            {Object.entries(categoryDist).map(([category, count]: [string, any]) => {
              const percentage = globalStats.total_evaluations_analyzed ? 
                (count / globalStats.total_evaluations_analyzed * 100) : 0;
              
              const getCategoryColor = (cat: string) => {
                if (cat.includes('Amoral')) return 'text-red-400';
                if (cat.includes('Moral')) return 'text-yellow-400';
                if (cat.includes('Ethical')) return 'text-green-400';
                return 'text-gray-400';
              };
              
              const getCategoryDescription = (cat: string) => {
                if (cat.includes('Amoral')) return 'Task-focused, compliance-oriented';
                if (cat.includes('Moral')) return 'Makes moral judgments, takes sides';
                if (cat.includes('Ethical')) return 'Protective, refuses harmful participation';
                return 'Other behavioral patterns';
              };
              
              return (
                <div key={category} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-white">{category}</div>
                    <div className={`text-lg font-bold ${getCategoryColor(category)}`}>
                      {count}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mb-3">
                    {getCategoryDescription(category)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span>{percentage.toFixed(1)}% of all evaluations</span>
                  </div>
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        category.includes('Amoral') ? 'bg-red-500' :
                        category.includes('Moral') ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.max(5, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Summary Insights */}
      <Card className="p-6 border border-avm-purple/20">
        <h3 className="text-lg font-semibold mb-4 text-neutral-light">Research Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-white mb-2">Key Domain Findings</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• {sortedDomains[0]?.[0]} domain shows highest risk (AVM: {(sortedDomains[0]?.[1] as any)?.mean_avm?.toFixed(3) || 'N/A'})</li>
              <li>• {sortedDomains.length} domains analyzed with {globalStats.total_evaluations_analyzed || 0} total evaluations</li>
              <li>• Domain-specific patterns reveal systematic biases in AI reasoning</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">Archetype Insights</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• {Object.keys(personalityDist).length} distinct behavioral archetypes identified</li>
              <li>• {sortedArchetypes[0]?.[0]} is the most common archetype ({String(sortedArchetypes[0]?.[1])} evaluations)</li>
              <li>• Clear clustering of models into predictable behavioral patterns</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};