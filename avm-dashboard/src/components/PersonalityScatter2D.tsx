import React, { useState } from 'react';
import { ChevronDown, Grid3X3 } from 'lucide-react';
import { Card } from './ui/Card';

interface PersonalityScatter2DProps {
  data?: any;
  isLoading?: boolean;
}

export const PersonalityScatter2D: React.FC<PersonalityScatter2DProps> = ({ data, isLoading }) => {
  const [xAxis, setXAxis] = useState('avm');
  const [yAxis, setYAxis] = useState('authority');
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-avm-purple"></div>
      </div>
    );
  }

  if (!data || !data.models) {
    return (
      <Card className="p-6 text-center">
        <Grid3X3 className="w-16 h-16 text-neutral-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-light mb-2">No Model Data Available</h3>
        <p className="text-neutral-muted">Unable to load behavioral scatter plot data.</p>
      </Card>
    );
  }

  const models = data.models || {};
  const archetypeReference = data.archetype_reference || {};

  // Define all 6 behavioral dimensions
  const dimensions = [
    { key: 'avm', label: 'AVM Score', fullName: 'Alignment Volatility Measurement' },
    { key: 'authority', label: 'Authority', fullName: 'Authority Appeal' },
    { key: 'firmness', label: 'Firmness', fullName: 'Response Firmness' },
    { key: 'complicity_avg', label: 'Complicity', fullName: 'Average Complicity' },
    { key: 'outcome_focus', label: 'Outcome Focus', fullName: 'Outcome Orientation' },
    { key: 'consistency', label: 'Consistency', fullName: 'Response Consistency' }
  ];

  // Get dimension info
  const xDimension = dimensions.find(d => d.key === xAxis) || dimensions[0];
  const yDimension = dimensions.find(d => d.key === yAxis) || dimensions[1];

  // Process model data for scatter plot
  const modelPoints = Object.entries(models).map(([modelName, modelData]: [string, any]) => {
    const behavioralScores = modelData.behavioral_scores || {};
    const xValue = behavioralScores[xAxis] || 0;
    const yValue = behavioralScores[yAxis] || 0;
    
    // Get personality info for color coding
    const meanPersonality = modelData.mean_personality?.code || '';
    const archetype = archetypeReference[meanPersonality];
    
    // Generate a unique color for each model
    const hash = modelName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const hue = Math.abs(hash) % 360;
    const color = `hsl(${hue}, 70%, 60%)`;

    return {
      id: modelName,
      name: modelName.split(':')[1]?.trim() || modelName,
      company: modelName.split(':')[0]?.trim() || 'Unknown',
      x: xValue,
      y: yValue,
      color,
      meanPersonality,
      archetypeName: archetype?.archetype_name || meanPersonality,
      evaluationCount: modelData.evaluation_count || 0,
      behavioralScores
    };
  });

  // Chart dimensions
  const chartWidth = 500;
  const chartHeight = 400;
  const padding = 60;
  const plotWidth = chartWidth - 2 * padding;
  const plotHeight = chartHeight - 2 * padding;

  // Calculate scales
  const xValues = modelPoints.map(p => p.x);
  const yValues = modelPoints.map(p => p.y);
  const xMin = Math.min(...xValues, 0);
  const xMax = Math.max(...xValues, 1);
  const yMin = Math.min(...yValues, 0);
  const yMax = Math.max(...yValues, 1);

  // Add some padding to the ranges
  const xRange = xMax - xMin;
  const yRange = yMax - yMin;
  const xPadding = xRange * 0.1;
  const yPadding = yRange * 0.1;

  const xScale = (value: number) => padding + ((value - (xMin - xPadding)) / (xRange + 2 * xPadding)) * plotWidth;
  const yScale = (value: number) => chartHeight - padding - ((value - (yMin - yPadding)) / (yRange + 2 * yPadding)) * plotHeight;

  // Generate grid lines
  const xTicks = 5;
  const yTicks = 5;
  const xTickValues = Array.from({length: xTicks}, (_, i) => 
    (xMin - xPadding) + ((xRange + 2 * xPadding) * i) / (xTicks - 1)
  );
  const yTickValues = Array.from({length: yTicks}, (_, i) => 
    (yMin - yPadding) + ((yRange + 2 * yPadding) * i) / (yTicks - 1)
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-neutral-light flex items-center">
          <Grid3X3 className="w-6 h-6 mr-2 text-avm-cyan" />
          2D Behavioral Scatter Plot
        </h3>
        
        {/* Axis Selectors */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-400">X-Axis:</label>
            <div className="relative">
              <select
                value={xAxis}
                onChange={(e) => setXAxis(e.target.value)}
                className="appearance-none bg-neural-dark border border-gray-600 rounded px-3 py-1 pr-8 text-white text-sm focus:outline-none focus:border-avm-cyan"
              >
                {dimensions.map((dim) => (
                  <option key={dim.key} value={dim.key}>
                    {dim.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-400">Y-Axis:</label>
            <div className="relative">
              <select
                value={yAxis}
                onChange={(e) => setYAxis(e.target.value)}
                className="appearance-none bg-neural-dark border border-gray-600 rounded px-3 py-1 pr-8 text-white text-sm focus:outline-none focus:border-avm-cyan"
              >
                {dimensions.map((dim) => (
                  <option key={dim.key} value={dim.key}>
                    {dim.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scatter Plot */}
        <div className="lg:col-span-2">
          <div className="relative bg-gray-900 rounded-lg p-4">
            <svg width={chartWidth} height={chartHeight} className="w-full h-auto">
              {/* Grid lines */}
              {xTickValues.map((tick, i) => (
                <line
                  key={`x-grid-${i}`}
                  x1={xScale(tick)}
                  y1={padding}
                  x2={xScale(tick)}
                  y2={chartHeight - padding}
                  stroke="rgba(139, 92, 246, 0.1)"
                  strokeWidth="1"
                />
              ))}
              {yTickValues.map((tick, i) => (
                <line
                  key={`y-grid-${i}`}
                  x1={padding}
                  y1={yScale(tick)}
                  x2={chartWidth - padding}
                  y2={yScale(tick)}
                  stroke="rgba(139, 92, 246, 0.1)"
                  strokeWidth="1"
                />
              ))}
              
              {/* Axes */}
              <line
                x1={padding}
                y1={chartHeight - padding}
                x2={chartWidth - padding}
                y2={chartHeight - padding}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="2"
              />
              <line
                x1={padding}
                y1={padding}
                x2={padding}
                y2={chartHeight - padding}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="2"
              />
              
              {/* Axis labels */}
              <text
                x={chartWidth / 2}
                y={chartHeight - 20}
                textAnchor="middle"
                className="text-sm fill-gray-300"
              >
                {xDimension.fullName}
              </text>
              <text
                x={20}
                y={chartHeight / 2}
                textAnchor="middle"
                className="text-sm fill-gray-300"
                transform={`rotate(-90, 20, ${chartHeight / 2})`}
              >
                {yDimension.fullName}
              </text>
              
              {/* Tick labels */}
              {xTickValues.map((tick, i) => (
                <text
                  key={`x-tick-${i}`}
                  x={xScale(tick)}
                  y={chartHeight - padding + 15}
                  textAnchor="middle"
                  className="text-xs fill-gray-400"
                >
                  {tick.toFixed(2)}
                </text>
              ))}
              {yTickValues.map((tick, i) => (
                <text
                  key={`y-tick-${i}`}
                  x={padding - 15}
                  y={yScale(tick) + 4}
                  textAnchor="middle"
                  className="text-xs fill-gray-400"
                >
                  {tick.toFixed(2)}
                </text>
              ))}
              
              {/* Data points */}
              {modelPoints.map((point) => (
                <circle
                  key={point.id}
                  cx={xScale(point.x)}
                  cy={yScale(point.y)}
                  r={hoveredModel === point.id ? 8 : 6}
                  fill={point.color}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredModel(point.id)}
                  onMouseLeave={() => setHoveredModel(null)}
                  opacity={hoveredModel === null || hoveredModel === point.id ? 1 : 0.4}
                />
              ))}
            </svg>
            
            {/* Hover tooltip */}
            {hoveredModel && (
              <div className="absolute top-4 right-4 bg-gray-800 rounded-lg p-3 border border-gray-600 min-w-64">
                {(() => {
                  const model = modelPoints.find(p => p.id === hoveredModel);
                  if (!model) return null;
                  return (
                    <div className="space-y-2">
                      <div className="font-semibold text-white">{model.name}</div>
                      <div className="text-sm text-gray-300">{model.company}</div>
                      <div className="text-xs text-gray-400">{model.evaluationCount} evaluations</div>
                      <div className="text-xs">
                        <span className="text-gray-400">Personality:</span>
                        <span className="font-mono text-avm-purple ml-1">{model.meanPersonality}</span>
                      </div>
                      <div className="text-xs text-gray-300">{model.archetypeName}</div>
                      <div className="border-t border-gray-600 pt-2 space-y-1">
                        <div className="text-xs">
                          <span className="text-gray-400">{xDimension.label}:</span>
                          <span className="ml-1 font-mono">{model.x.toFixed(3)}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-400">{yDimension.label}:</span>
                          <span className="ml-1 font-mono">{model.y.toFixed(3)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Legend and Stats */}
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-neutral-light mb-3">Model Distribution</h4>
            <div className="text-sm text-gray-400 space-y-1">
              <div>Total Models: {modelPoints.length}</div>
              <div>X-Axis Range: {(xMax - xMin).toFixed(3)}</div>
              <div>Y-Axis Range: {(yMax - yMin).toFixed(3)}</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-neutral-light mb-3">Current Axes</h4>
            <div className="space-y-3 text-sm">
              <div className="bg-gray-800 rounded p-3">
                <div className="font-medium text-avm-cyan">X: {xDimension.fullName}</div>
                <div className="text-xs text-gray-400 mt-1">{xDimension.label}</div>
              </div>
              <div className="bg-gray-800 rounded p-3">
                <div className="font-medium text-avm-cyan">Y: {yDimension.fullName}</div>
                <div className="text-xs text-gray-400 mt-1">{yDimension.label}</div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-neutral-light mb-3">Interaction</h4>
            <div className="text-xs text-gray-400 space-y-1">
              <div>• Hover over points for details</div>
              <div>• Each model has a unique color</div>
              <div>• Select different axes to explore relationships</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
