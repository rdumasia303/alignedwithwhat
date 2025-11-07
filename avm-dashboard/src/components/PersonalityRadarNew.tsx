import React, { useState } from 'react';
import { Brain, ChevronDown } from 'lucide-react';
import { Card } from './ui/Card';

interface PersonalityRadarProps {
  data?: any;
  isLoading?: boolean;
  detailed?: boolean;
}

export const PersonalityRadarNew: React.FC<PersonalityRadarProps> = ({ 
  data, 
  detailed = false 
}) => {
  const [selectedModel, setSelectedModel] = useState<string>('');

  // Don't show loading spinner - let content render immediately with fallbacks
  // if (isLoading) {
  //   return (
  //     <div className="flex items-center justify-center h-64">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-avm-purple"></div>
  //     </div>
  //   );
  // }

  if (!data || !data.models) {
    return (
      <Card className="p-6 text-center">
        <Brain className="w-16 h-16 text-neutral-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-light mb-2">No Model Data Available</h3>
        <p className="text-neutral-muted">Unable to load behavioral radar data.</p>
      </Card>
    );
  }

  const models = data.models || {};
  const modelEntries = Object.entries(models).map(([name, modelData]: [string, any]) => ({
    id: name,
    name: name.split(':')[1]?.trim() || name,
    company: name.split(':')[0]?.trim() || 'Unknown',
    data: modelData
  }));

  // Get selected model or first model if none selected
  const currentModel = selectedModel ? 
    modelEntries.find(m => m.id === selectedModel) : 
    modelEntries[0];

  if (!currentModel) {
    return (
      <Card className="p-6 text-center">
        <Brain className="w-16 h-16 text-neutral-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-light mb-2">No Models Available</h3>
        <p className="text-neutral-muted">No model data found to display.</p>
      </Card>
    );
  }

  // Extract all 6 behavioral dimensions
  const behavioralScores = currentModel.data.behavioral_scores || {};
  const traits = [
    { 
      name: 'AVM', 
      fullName: 'Alignment Volatility',
      value: (behavioralScores.avm || 0) * 100, 
      color: '#EF4444',
      description: 'Inconsistency between A/B responses'
    },
    { 
      name: 'Complicity', 
      fullName: 'Average Complicity',
      value: (behavioralScores.complicity_avg || 0) * 100, 
      color: '#F59E0B',
      description: 'Willingness to help with requests'
    },
    { 
      name: 'Authority', 
      fullName: 'Authority Appeal',
      value: (behavioralScores.authority || 0) * 100, 
      color: '#8B5CF6',
      description: 'Deference to authority figures'
    },
    { 
      name: 'Firmness', 
      fullName: 'Response Firmness',
      value: (behavioralScores.firmness || 0) * 100, 
      color: '#06B6D4',
      description: 'Strength of moral stance'
    },
    { 
      name: 'Outcome Focus', 
      fullName: 'Outcome Orientation',
      value: (behavioralScores.outcome_focus || 0) * 100, 
      color: '#10B981',
      description: 'Focus on results vs. principles'
    },
    { 
      name: 'Consistency', 
      fullName: 'Response Consistency',
      value: (behavioralScores.consistency || 0) * 100, 
      color: '#F97316',
      description: 'Predictability across scenarios'
    }
  ];

  const renderRadarChart = () => {
    const centerX = 180;
    const centerY = 180;
    const maxRadius = 120;
    const numTraits = traits.length;

    // Generate path for filled area
    const pathPoints = traits.map((trait, index) => {
      const angle = (index * 2 * Math.PI) / numTraits - Math.PI / 2;
      const radius = (trait.value / 100) * maxRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      return `${x},${y}`;
    });

    const pathString = `M${pathPoints[0]} L${pathPoints.slice(1).join(' L')} Z`;

    return (
      <div className="relative px-8 py-4">
        <svg width="280" height="280" viewBox="0 0 360 360" className="mx-auto w-full max-w-sm lg:max-w-md">
          {/* Background grid circles */}
          {[20, 40, 60, 80, 100].map(percentage => (
            <circle
              key={percentage}
              cx={centerX}
              cy={centerY}
              r={(percentage / 100) * maxRadius}
              fill="none"
              stroke="rgba(139, 92, 246, 0.1)"
              strokeWidth="1"
            />
          ))}
          
          {/* Axis lines */}
          {traits.map((_, index) => {
            const angle = (index * 2 * Math.PI) / numTraits - Math.PI / 2;
            const endX = centerX + Math.cos(angle) * maxRadius;
            const endY = centerY + Math.sin(angle) * maxRadius;
            
            return (
              <line
                key={index}
                x1={centerX}
                y1={centerY}
                x2={endX}
                y2={endY}
                stroke="rgba(139, 92, 246, 0.2)"
                strokeWidth="1"
              />
            );
          })}
          
          {/* Data area */}
          <path
            d={pathString}
            fill="rgba(139, 92, 246, 0.2)"
            stroke="#8B5CF6"
            strokeWidth="2"
            className="animate-pulse"
          />
          
          {/* Data points - removed hover functionality due to sensitivity */}
          {traits.map((trait, index) => {
            const angle = (index * 2 * Math.PI) / numTraits - Math.PI / 2;
            const radius = (trait.value / 100) * maxRadius;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            return (
              <circle
                key={trait.name}
                cx={x}
                cy={y}
                r="4"
                fill={trait.color}
                stroke="white"
                strokeWidth="2"
                className="transition-all duration-200"
              />
            );
          })}
          
          {/* Labels */}
          {traits.map((trait, index) => {
            const angle = (index * 2 * Math.PI) / numTraits - Math.PI / 2;
            const labelRadius = maxRadius + 35;
            const x = centerX + Math.cos(angle) * labelRadius;
            const y = centerY + Math.sin(angle) * labelRadius;
            
            return (
              <g key={trait.name}>
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm font-medium fill-neural-light"
                  style={{ fill: '#F1F5F9' }}
                >
                  {trait.name}
                </text>
                {detailed && (
                  <text
                    x={x}
                    y={y + 12}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-sm fill-gray-300"
                    style={{ fill: '#D1D5DB' }}
                  >
                    {trait.value.toFixed(0)}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-neutral-light flex items-center">
          <Brain className="w-6 h-6 mr-2 text-avm-purple" />
          Behavioral Radar Analysis
        </h3>
        
        {/* Model Selector */}
        <div className="relative">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="appearance-none bg-neural-dark border border-gray-600 rounded px-4 py-2 pr-8 text-white text-sm focus:outline-none focus:border-avm-purple"
          >
            {modelEntries.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.company})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="flex flex-col items-center">
          {renderRadarChart()}
          <div className="text-center mt-4">
            <h4 className="font-semibold text-neutral-light">{currentModel.name}</h4>
            <p className="text-sm text-neutral-muted">{currentModel.company}</p>
            <p className="text-xs text-neutral-muted mt-1">
              {currentModel.data.evaluation_count || 0} evaluations
            </p>
            
            {/* Mean and Mode Personalities */}
            <div className="mt-3 space-y-2 text-xs">
              {currentModel.data.mean_personality && (
                <div className="bg-gray-800 rounded px-3 py-2">
                  <span className="text-gray-400">Mean Personality:</span>
                  <div className="font-mono text-avm-purple font-bold">
                    {currentModel.data.mean_personality.code}
                  </div>
                  {currentModel.data.mean_personality.archetype_name && (
                    <div className="text-gray-300 text-xs">
                      {currentModel.data.mean_personality.archetype_name}
                    </div>
                  )}
                </div>
              )}
              {currentModel.data.mode_personality && (
                <div className="bg-gray-800 rounded px-3 py-2">
                  <span className="text-gray-400">Mode Personality:</span>
                  <div className="font-mono text-avm-cyan font-bold">
                    {currentModel.data.mode_personality.code}
                  </div>
                  {currentModel.data.mode_personality.archetype_name && (
                    <div className="text-gray-300 text-xs">
                      {currentModel.data.mode_personality.archetype_name}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trait Details */}
        <div className="space-y-3">
          <h4 className="font-semibold text-neutral-light mb-4">Dimensional Breakdown</h4>
          {traits.map((trait) => (
            <div key={trait.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-neutral-light">{trait.fullName}</span>
                <span className="text-sm font-mono text-neutral-light">{trait.value.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-neural-dark rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${trait.value}%`,
                    backgroundColor: trait.color
                  }}
                />
              </div>
              <p className="text-xs text-neutral-muted">{trait.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
