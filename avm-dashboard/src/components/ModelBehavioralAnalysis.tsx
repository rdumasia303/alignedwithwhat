import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  AlertTriangle, 
  ChevronDown, 
  ChevronRight, 
  Scale,
  BarChart3
} from 'lucide-react';
import { Card } from './ui/Card';

interface ModelBehavioralAnalysisProps {
  data?: any;
  isLoading?: boolean;
}

export const ModelBehavioralAnalysis: React.FC<ModelBehavioralAnalysisProps> = ({ data, isLoading }) => {
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-avm-purple"></div>
      </div>
    );
  }

  const models = data?.models || {};
  const archetypeReference = data?.archetype_reference || {};
  const referenceData = data?.reference_data || {};
  
  // Utility functions to get reference data
  const getScenarioTypeInfo = (scenarioTypeName: string) => {
    return referenceData.scenario_types?.find((st: any) => 
      st.scenario_type_name === scenarioTypeName
    );
  };
  
  const getSeverityLevelInfo = (severityLevelName: string) => {
    return referenceData.severity_levels?.find((sl: any) => 
      sl.severity_level_name === severityLevelName
    );
  };
  
  // Sort models by risk level (average complicity score)
  const modelEntries = Object.entries(models).sort(([,a], [,b]) => {
    const aComplicity = (a as any).behavioral_scores?.complicity_avg || 0;
    const bComplicity = (b as any).behavioral_scores?.complicity_avg || 0;
    return bComplicity - aComplicity; // Highest risk first
  });

  const getBehavioralColor = (score: number) => {
    if (score > 0.8) return '#EF4444'; // High risk - red
    if (score > 0.6) return '#F59E0B'; // Medium-high - amber
    if (score > 0.4) return '#10B981'; // Medium - green
    return '#06B6D4'; // Low - cyan
  };

  const getRiskLevel = (complicity: number) => {
    if (complicity > 0.8) return { level: 'CRITICAL', color: '#DC2626' };
    if (complicity > 0.7) return { level: 'HIGH', color: '#EF4444' };
    if (complicity > 0.5) return { level: 'MEDIUM', color: '#F59E0B' };
    if (complicity > 0.3) return { level: 'LOW', color: '#10B981' };
    return { level: 'MINIMAL', color: '#06B6D4' };
  };

  const getStanceColor = (stance: string) => {
    switch (stance) {
      case 'Resistant': return '#10B981';
      case 'Selective': return '#F59E0B';
      case 'Compliant': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderRadarChart = (scores: any) => {
    const [hoveredDot, setHoveredDot] = useState<number | null>(null);
    
    const dimensions = [
      { name: 'AVM', value: scores.avm || 0, color: '#EF4444' },
      { name: 'Complicity Avg', value: scores.complicity_avg || 0, color: '#F97316' },
      { name: 'Firmness', value: scores.firmness || 0, color: '#8B5CF6' },
      { name: 'Authority', value: scores.authority || 0, color: '#06B6D4' },
      { name: 'Outcome Focus', value: scores.outcome_focus || 0, color: '#10B981' },
      { name: 'Consistency', value: scores.consistency || 0, color: '#F59E0B' }
    ];

    return (
      <div className="relative w-32 h-32 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Background circles */}
          {[20, 40, 60, 80].map(radius => (
            <circle
              key={radius}
              cx="50"
              cy="50"
              r={radius / 2}
              fill="none"
              stroke="rgba(241, 245, 249, 0.1)"
              strokeWidth="0.5"
            />
          ))}
          
          {/* Radar lines */}
          {dimensions.map((_, i) => {
            const angle = (i * 60 - 90) * (Math.PI / 180);
            const x = 50 + 40 * Math.cos(angle);
            const y = 50 + 40 * Math.sin(angle);
            return (
              <line
                key={i}
                x1="50"
                y1="50"
                x2={x}
                y2={y}
                stroke="rgba(241, 245, 249, 0.1)"
                strokeWidth="0.5"
              />
            );
          })}
          
          {/* Data polygon */}
          <path
            d={dimensions.map((dim, i) => {
              const angle = (i * 60 - 90) * (Math.PI / 180);
              const radius = (dim.value * 40);
              const x = 50 + radius * Math.cos(angle);
              const y = 50 + radius * Math.sin(angle);
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ') + ' Z'}
            fill="rgba(139, 92, 246, 0.2)"
            stroke="#8B5CF6"
            strokeWidth="1"
          />
          
          {/* Data points with hover areas */}
          {dimensions.map((dim, i) => {
            const angle = (i * 60 - 90) * (Math.PI / 180);
            const radius = (dim.value * 40);
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            return (
              <g key={i}>
                {/* Invisible larger circle for easier hovering */}
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredDot(i)}
                  onMouseLeave={() => setHoveredDot(null)}
                />
                {/* Visible dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={hoveredDot === i ? "2.5" : "1.5"}
                  fill={dim.color}
                  className="transition-all duration-200 pointer-events-none"
                />
              </g>
            );
          })}
        </svg>
        
        {/* Tooltip */}
        {hoveredDot !== null && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full mt-2 z-10">
            <div className="bg-neural-darker border border-neural-medium rounded px-2 py-1 text-xs text-neural-light whitespace-nowrap shadow-lg">
              <div className="font-medium text-white">{dimensions[hoveredDot].name}</div>
              <div className="text-neural-muted">
                {(dimensions[hoveredDot].value * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-8 bg-gradient-to-br from-neural-darker/90 to-neural-medium/50 border-avm-purple/20">
        <div className="max-w-5xl">
          <h2 className="text-2xl font-bold text-neural-light mb-4 flex items-center">
            <Brain className="w-7 h-7 mr-3 text-avm-purple" />
            AI Model Moral Pattern Analysis
          </h2>
          <p className="text-neural-light leading-relaxed">
            Deep behavioral analysis of how each AI model responds to moral conflicts. Models are 
            <span className="text-avm-red font-semibold"> ranked by risk level</span> (highest average complicity first), 
            showing both their <span className="text-avm-cyan">mean personality</span> (average behavior) and 
            <span className="text-avm-purple"> mode personality</span> (most common behavior). 
            The <span className="text-avm-red">AVM (Alignment Volatility Metric)</span> measures behavioral inconsistency 
            between scenarios. Expand any model to see detailed breakdowns across scenarios, severity levels, and power dynamics.
          </p>
        </div>
      </Card>

      {/* Model Cards */}
      <div className="space-y-4">
        {modelEntries.map(([modelName, modelData]: [string, any], index) => {
          const behavioralScores = modelData.behavioral_scores || {};
          const riskInfo = getRiskLevel(behavioralScores.complicity_avg || 0);
          const isExpanded = expandedModel === modelName;
          const meanPersonality = modelData.mean_personality;
          const modePersonality = modelData.mode_personality;
          const behavioralPatterns = modelData.behavioral_patterns || {};
          const categoricalAnalysis = modelData.categorical_analysis || {};
          
          return (
            <motion.div 
              key={modelName} 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden">
                {/* Model Header */}
                <button
                  onClick={() => setExpandedModel(isExpanded ? null : modelName)}
                  className="w-full p-4 lg:p-6 hover:bg-neural-medium/20 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6 flex-1">
                      {/* Risk Badge */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div 
                          className="w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: riskInfo.color }}
                        >
                          #{index + 1}
                        </div>
                        <span 
                          className="text-xs font-medium mt-1 px-2 py-0.5 rounded"
                          style={{ 
                            backgroundColor: `${riskInfo.color}20`,
                            color: riskInfo.color
                          }}
                        >
                          {riskInfo.level}
                        </span>
                      </div>

                      {/* Model Info */}
                      <div className="text-left flex-1 min-w-0">
                        <h3 className="text-lg lg:text-xl font-bold text-neural-light mb-2">
                          {modelName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm text-neural-muted">
                          <span>{modelData.evaluation_count} evaluations</span>
                          <span className="hidden sm:inline">•</span>
                          <span>Complicity: {(behavioralScores.complicity_avg * 100).toFixed(0)}%</span>
                          <span className="hidden sm:inline">•</span>
                          <span>AVM: {(behavioralScores.avm * 100).toFixed(0)}%</span>
                          <span className="hidden sm:inline">•</span>
                          <span>Consistency: {(behavioralScores.consistency * 100).toFixed(0)}%</span>
                        </div>
                        
                        {/* Personality Types - Stack on mobile */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3">
                          {meanPersonality && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-avm-cyan">Mean:</span>
                              <span className="text-xs text-neural-muted truncate">
                                {archetypeReference[meanPersonality.code]?.archetype_name}
                              </span>
                              <span className="font-mono text-xs bg-avm-cyan/20 px-2 py-1 rounded text-avm-cyan">
                                {meanPersonality.code}
                              </span>
                            </div>
                          )}
                          {modePersonality && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-avm-purple">Mode:</span>
                              <span className="text-xs text-neural-muted truncate">
                                {archetypeReference[modePersonality.code]?.archetype_name}
                              </span>
                              <span className="font-mono text-xs bg-avm-purple/20 px-2 py-1 rounded text-avm-purple">
                                {modePersonality.code}
                              </span>
                              <span className="text-xs text-neural-muted">
                                ({modePersonality.percentage?.toFixed(1)}%)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mini Radar Chart - Show on medium and larger screens */}
                    <div className="hidden lg:block flex-shrink-0">
                      {renderRadarChart(behavioralScores)}
                    </div>

                    {/* Expand Icon */}
                    <div className="ml-4">
                      {isExpanded ? (
                        <ChevronDown className="w-6 h-6 text-neural-muted" />
                      ) : (
                        <ChevronRight className="w-6 h-6 text-neural-muted" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="bg-neural-dark/30"
                    >
                      <div className="p-6 space-y-8">
                        {/* Behavioral Profile Section */}
                        <div>
                          <h4 className="text-lg font-semibold text-neural-light mb-4 flex items-center">
                            <BarChart3 className="w-5 h-5 mr-2 text-avm-cyan" />
                            Detailed Behavioral Profile
                          </h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Behavioral Scores */}
                            <div className="space-y-3">
                              {Object.entries(behavioralScores).map(([key, value]: [string, any]) => {
                                // Define unique colors for each behavioral dimension
                                const dimensionColors = {
                                  avm: '#EF4444',           // Red
                                  complicity_avg: '#F59E0B', // Amber 
                                  complicity_a: '#EC4899',   // Pink
                                  complicity_b: '#8B5CF6',   // Purple
                                  authority: '#06B6D4',      // Cyan
                                  firmness: '#10B981',       // Green
                                  outcome_focus: '#F97316',  // Orange
                                  consistency: '#3B82F6'     // Blue
                                };
                                
                                const color = dimensionColors[key as keyof typeof dimensionColors] || '#6B7280';
                                
                                return (
                                  <div key={key} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-neural-light capitalize">
                                        {key.replace('_', ' ')}
                                      </span>
                                      <span className="font-medium text-neural-light">
                                        {(value * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-neural-dark rounded-full h-2">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${value * 100}%` }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                        className="h-2 rounded-full"
                                        style={{ backgroundColor: color }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Stance Distribution */}
                            <div>
                              <h5 className="text-sm font-semibold text-neural-muted mb-3">Stance Distribution</h5>
                              <div className="space-y-2">
                                {Object.entries(behavioralPatterns.stance_distribution || {}).map(([stance, count]: [string, any]) => {
                                  const percentage = modelData.evaluation_count > 0 ? (count / modelData.evaluation_count * 100) : 0;
                                  return (
                                    <div key={stance} className="flex items-center justify-between">
                                      <span className="text-sm text-neural-light">{stance}</span>
                                      <div className="flex items-center space-x-2">
                                        <div className="w-20 bg-neural-dark rounded-full h-1.5">
                                          <div 
                                            className="h-1.5 rounded-full"
                                            style={{ 
                                              width: `${percentage}%`,
                                              backgroundColor: getStanceColor(stance)
                                            }}
                                          />
                                        </div>
                                        <span className="text-xs text-neural-muted w-10 text-right">
                                          {percentage.toFixed(0)}%
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            
                            {/* Bias Direction Analysis */}
                            <div>
                              <h5 className="text-sm font-semibold text-neural-muted mb-3">Bias Direction</h5>
                              <div className="space-y-2">
                                {Object.entries(behavioralPatterns.bias_category_distribution || {}).map(([bias, count]: [string, any]) => {
                                  const percentage = modelData.evaluation_count > 0 ? (count / modelData.evaluation_count * 100) : 0;
                                  const biasColor = bias === 'Bias-A' ? '#10B981' : 
                                                   bias === 'Bias-B' ? '#EF4444' : '#6B7280';
                                  return (
                                    <div key={bias} className="flex items-center justify-between">
                                      <span className="text-sm text-neural-light">{bias}</span>
                                      <div className="flex items-center space-x-2">
                                        <div className="w-20 bg-neural-dark rounded-full h-1.5">
                                          <div 
                                            className="h-1.5 rounded-full"
                                            style={{ 
                                              width: `${percentage}%`,
                                              backgroundColor: biasColor
                                            }}
                                          />
                                        </div>
                                        <span className="text-xs text-neural-muted w-10 text-right">
                                          {percentage.toFixed(0)}%
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              {behavioralPatterns.avg_bias_direction !== undefined && (
                                <div className="mt-3 p-2 bg-neural-dark/50 rounded text-xs">
                                  <span className="text-neural-muted">Average Bias Direction: </span>
                                  <span className="font-medium text-neural-light">
                                    {(behavioralPatterns.avg_bias_direction * 100).toFixed(1)}%
                                  </span>
                                  <span className="text-neural-muted ml-1">
                                    (toward {behavioralPatterns.avg_bias_direction > 0 ? 'Bias-B' : 'Bias-A'})
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Scenario Analysis */}
                        {categoricalAnalysis.scenario_types && (
                          <div>
                            <h4 className="text-lg font-semibold text-neural-light mb-4 flex items-center">
                              <BarChart3 className="w-5 h-5 mr-2 text-avm-emerald" />
                              Performance by Scenario Type
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {Object.entries(categoricalAnalysis.scenario_types).map(([scenarioType, data]: [string, any]) => {
                                const scenarioInfo = getScenarioTypeInfo(scenarioType);
                                return (
                                  <div key={scenarioType} className="bg-neural-medium/30 p-4 rounded-lg">
                                    <div className="mb-3">
                                      <h5 className="font-semibold text-neural-light mb-1 capitalize">
                                        {scenarioType.replace('_', ' ')}
                                      </h5>
                                      {scenarioInfo && (
                                        <>
                                          <p className="text-xs text-neural-muted mb-2 leading-relaxed">
                                            {scenarioInfo.description}
                                          </p>
                                          <div className="mb-2">
                                            <span className="text-xs text-avm-cyan font-medium">Optimal archetypes:</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {scenarioInfo.optimal_archetypes?.slice(0, 2).map((archetype: string, idx: number) => (
                                                <span key={idx} className="text-xs bg-avm-cyan/10 text-avm-cyan px-1.5 py-0.5 rounded">
                                                  {archetype}
                                                </span>
                                              ))}
                                              {scenarioInfo.optimal_archetypes?.length > 2 && (
                                                <span className="text-xs text-neural-muted">
                                                  +{scenarioInfo.optimal_archetypes.length - 2} more
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-neural-muted">Evaluations:</span>
                                        <span className="text-neural-light">{data.evaluation_count}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-neural-muted">AVM (Volatility):</span>
                                        <span 
                                          className="font-medium"
                                          style={{ color: getBehavioralColor(data.avg_avm || 0) }}
                                        >
                                          {((data.avg_avm || 0) * 100).toFixed(0)}%
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-neural-muted">Avg Complicity:</span>
                                        <span 
                                          className="font-medium"
                                          style={{ color: getBehavioralColor(data.avg_complicity || 0) }}
                                        >
                                          {((data.avg_complicity || 0) * 100).toFixed(0)}%
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex justify-between">
                                          <span className="text-neural-muted">Complicity A:</span>
                                          <span className="text-neural-light">
                                            {((data.avg_complicity_a || 0) * 100).toFixed(0)}%
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-neural-muted">Complicity B:</span>
                                          <span className="text-neural-light">
                                            {((data.avg_complicity_b || 0) * 100).toFixed(0)}%
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-neural-muted">Dominant Stance:</span>
                                        <span 
                                          className="font-medium"
                                          style={{ color: getStanceColor(data.dominant_stance) }}
                                        >
                                          {data.dominant_stance}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Severity Analysis */}
                        {categoricalAnalysis.severity_levels && (
                          <div>
                            <h4 className="text-lg font-semibold text-neural-light mb-4 flex items-center">
                              <AlertTriangle className="w-5 h-5 mr-2 text-avm-amber" />
                              Risk by Severity Level
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Object.entries(categoricalAnalysis.severity_levels)
                                .sort(([aName], [bName]) => {
                                  const aSeverity = getSeverityLevelInfo(aName);
                                  const bSeverity = getSeverityLevelInfo(bName);
                                  return (aSeverity?.severity_weight || 0) - (bSeverity?.severity_weight || 0);
                                })
                                .map(([severity, data]: [string, any]) => {
                                const severityInfo = getSeverityLevelInfo(severity);
                                return (
                                  <div key={severity} className="bg-neural-medium/30 p-4 rounded-lg">
                                    <div className="mb-3">
                                      <h5 className="font-semibold text-neural-light mb-1 capitalize text-lg">
                                        {severity}
                                      </h5>
                                      {severityInfo && (
                                        <>
                                          <p className="text-xs text-neural-muted mb-2 leading-relaxed">
                                            {severityInfo.description}
                                          </p>
                                          <div className="mb-2 p-2 bg-neural-dark/30 rounded text-xs">
                                            <span className="text-avm-amber font-medium">Guidance: </span>
                                            <span className="text-neural-light">
                                              {severityInfo.scaling_guidance}
                                            </span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="text-2xl font-bold mb-1" style={{ color: getBehavioralColor(data.avg_complicity || 0) }}>
                                          {((data.avg_complicity || 0) * 100).toFixed(0)}%
                                        </div>
                                        <div className="text-xs text-neural-muted">
                                          avg complicity
                                        </div>
                                        <div className="text-sm font-medium mt-1" style={{ color: getBehavioralColor(data.avg_avm || 0) }}>
                                          {((data.avg_avm || 0) * 100).toFixed(0)}% AVM
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-lg font-medium text-neural-light">
                                          {data.evaluation_count}
                                        </div>
                                        <div className="text-xs text-neural-muted">
                                          evaluations
                                        </div>
                                        <div className="text-xs text-neural-muted mt-1">
                                          A: {((data.avg_complicity_a || 0) * 100).toFixed(0)}% | B: {((data.avg_complicity_b || 0) * 100).toFixed(0)}%
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Power Dynamics */}
                        {categoricalAnalysis.power_dynamics && (
                          <div>
                            <h4 className="text-lg font-semibold text-neural-light mb-4 flex items-center">
                              <Scale className="w-5 h-5 mr-2 text-avm-red" />
                              Behavior by Power Dynamics
                            </h4>
                            <div className="space-y-3">
                              {Object.entries(categoricalAnalysis.power_dynamics)
                                .sort(([,a], [,b]) => (b as any).evaluation_count - (a as any).evaluation_count)
                                .map(([powerType, data]: [string, any]) => (
                                <div key={powerType} className="flex items-center justify-between p-3 bg-neural-medium/20 rounded-lg">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-neural-light text-sm capitalize">
                                      {powerType.replace(/asymmetrical_power \(|\)/g, '').replace('_', ' ')}
                                    </h5>
                                    <div className="text-xs text-neural-muted">
                                      {data.evaluation_count} evaluations • {data.dominant_stance} stance
                                    </div>
                                    <div className="text-xs text-neural-muted mt-1">
                                      A: {((data.avg_complicity_a || 0) * 100).toFixed(0)}% | B: {((data.avg_complicity_b || 0) * 100).toFixed(0)}%
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div 
                                      className="text-lg font-bold"
                                      style={{ color: getBehavioralColor(data.avg_complicity || 0) }}
                                    >
                                      {((data.avg_complicity || 0) * 100).toFixed(0)}%
                                    </div>
                                    <div className="text-xs text-neural-muted">avg complicity</div>
                                    <div 
                                      className="text-sm font-medium"
                                      style={{ color: getBehavioralColor(data.avg_avm || 0) }}
                                    >
                                      {((data.avg_avm || 0) * 100).toFixed(0)}% AVM
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};