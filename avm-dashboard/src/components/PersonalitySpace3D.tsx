import React, { useState, useRef } from 'react';
import { Box, RotateCcw, ChevronDown } from 'lucide-react';
import { Card } from './ui/Card';

interface PersonalitySpace3DProps {
  data?: any;
  isLoading?: boolean;
}

type Dimension = 'avm' | 'complicity_avg' | 'authority' | 'firmness' | 'outcome_focus' | 'consistency';

interface ModelPoint {
  id: string;
  name: string;
  company: string;
  x: number;
  y: number;
  z: number;
  color: string;
  archetype: string;
  evaluationCount: number;
  behavioralScores: any;
}

export const PersonalitySpace3D: React.FC<PersonalitySpace3DProps> = ({ data, isLoading }) => {
  const [xAxis, setXAxis] = useState<Dimension>('avm');
  const [yAxis, setYAxis] = useState<Dimension>('authority');
  const [zAxis, setZAxis] = useState<Dimension>('complicity_avg');
  const [rotation, setRotation] = useState({ x: 0, y: 30 }); // Better initial angle
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  const dimensions = [
    { key: 'avm' as Dimension, label: 'Alignment Volatility (AVM)', color: '#EF4444' },
    { key: 'complicity_avg' as Dimension, label: 'Average Complicity', color: '#F59E0B' },
    { key: 'authority' as Dimension, label: 'Authority Appeal', color: '#8B5CF6' },
    { key: 'firmness' as Dimension, label: 'Response Firmness', color: '#06B6D4' },
    { key: 'outcome_focus' as Dimension, label: 'Outcome Focus', color: '#10B981' },
    { key: 'consistency' as Dimension, label: 'Consistency', color: '#F97316' }
  ];

  const getDimensionLabel = (dim: Dimension) => {
    return dimensions.find(d => d.key === dim)?.label || dim;
  };

  const getDimensionColor = (dim: Dimension) => {
    return dimensions.find(d => d.key === dim)?.color || '#CCCCCC';
  };

  // Generate model points from data
  const modelPoints: ModelPoint[] = React.useMemo(() => {
    if (!data?.models) return [];

    // Generate distinct colors for each model
    const colors = [
      '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
      '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#14B8A6', '#F43F5E',
      '#22C55E', '#A855F7', '#EAB308', '#3B82F6', '#F97316', '#8B5CF6'
    ];

    return Object.entries(data.models).map(([modelName, modelData]: [string, any], index) => {
      const behavioralScores = modelData.behavioral_scores || {};
      const meanPersonality = modelData.mean_personality || {};
      
      return {
        id: modelName,
        name: modelName.split(':')[1]?.trim() || modelName,
        company: modelName.split(':')[0]?.trim() || 'Unknown',
        x: behavioralScores[xAxis] || 0,
        y: behavioralScores[yAxis] || 0,
        z: behavioralScores[zAxis] || 0,
        color: colors[index % colors.length], // Distinct color for each model
        archetype: meanPersonality.code || 'Unknown',
        evaluationCount: modelData.evaluation_count || 0,
        behavioralScores: behavioralScores
      };
    });
  }, [data, xAxis, yAxis, zAxis]);

  // 3D to 2D projection with bottom-left origin
  const project3D = (x: number, y: number, z: number) => {
    const scale = 220; // Larger scale for more space
    const marginLeft = 120; // Space from left edge
    const marginBottom = 80; // Space from bottom edge
    const viewportHeight = 600; // Updated to match SVG height
    
    // Convert rotation to radians
    const rotX = (rotation.x * Math.PI) / 180;
    const rotY = (rotation.y * Math.PI) / 180;
    
    // Apply rotation matrices
    // Rotate around Y axis first
    const x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
    const z1 = x * Math.sin(rotY) + z * Math.cos(rotY);
    
    // Then rotate around X axis
    const y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
    const z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);
    
    // Project with origin at bottom-left
    return {
      x: marginLeft + (x1 + 1) * scale, // +1 to shift from [-1,1] to [0,2] range
      y: viewportHeight - marginBottom - (y2 + 1) * scale, // Flip Y and position from bottom
      z: z2 // Keep z for depth sorting
    };
  };

  // Mouse handlers for rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;
    
    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x + deltaY * 0.5)),
      y: (prev.y + deltaX * 0.5) % 360
    }));
    
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset rotation to better initial position
  const resetRotation = () => {
    setRotation({ x: 0, y: 30 });
  };

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
        <Box className="w-16 h-16 text-neutral-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-light mb-2">No Data Available</h3>
        <p className="text-neutral-muted">Unable to load 3D personality space data.</p>
      </Card>
    );
  }

  // Sort points by z-depth for proper rendering
  const sortedPoints = modelPoints
    .map(point => ({
      ...point,
      projected: project3D(point.x, point.y, point.z)
    }))
    .sort((a, b) => a.projected.z - b.projected.z);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-neutral-light flex items-center">
          <Box className="w-6 h-6 mr-2 text-avm-purple" />
          3D Personality Space
        </h3>
        
        <button
          onClick={resetRotation}
          className="flex items-center space-x-2 px-3 py-2 bg-neural-dark border border-gray-600 rounded text-white text-sm hover:bg-neural-medium transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset View</span>
        </button>
      </div>

      {/* Axis Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm text-neutral-muted mb-2">X-Axis</label>
          <div className="relative">
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value as Dimension)}
              className="appearance-none bg-neural-dark border border-gray-600 rounded px-4 py-2 pr-8 text-white text-sm focus:outline-none focus:border-avm-purple w-full"
              style={{ borderLeftColor: getDimensionColor(xAxis), borderLeftWidth: '4px' }}
            >
              {dimensions.map(dim => (
                <option key={dim.key} value={dim.key}>{dim.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-neutral-muted mb-2">Y-Axis</label>
          <div className="relative">
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value as Dimension)}
              className="appearance-none bg-neural-dark border border-gray-600 rounded px-4 py-2 pr-8 text-white text-sm focus:outline-none focus:border-avm-purple w-full"
              style={{ borderLeftColor: getDimensionColor(yAxis), borderLeftWidth: '4px' }}
            >
              {dimensions.map(dim => (
                <option key={dim.key} value={dim.key}>{dim.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-neutral-muted mb-2">Z-Axis (Depth)</label>
          <div className="relative">
            <select
              value={zAxis}
              onChange={(e) => setZAxis(e.target.value as Dimension)}
              className="appearance-none bg-neural-dark border border-gray-600 rounded px-4 py-2 pr-8 text-white text-sm focus:outline-none focus:border-avm-purple w-full"
              style={{ borderLeftColor: getDimensionColor(zAxis), borderLeftWidth: '4px' }}
            >
              {dimensions.map(dim => (
                <option key={dim.key} value={dim.key}>{dim.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 3D Visualization - Larger viewport */}
      <div className="relative bg-neural-dark/30 rounded-lg overflow-hidden border border-gray-600">
        <svg
          ref={svgRef}
          width="900"
          height="600"
          viewBox="0 0 900 600"
          className="w-full h-auto cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid lines for reference */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(139, 92, 246, 0.1)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Axis lines */}
          {(() => {
            const origin = project3D(0, 0, 0);
            const xEnd = project3D(1, 0, 0);
            const yEnd = project3D(0, 1, 0);
            const zEnd = project3D(0, 0, 1);
            
            return (
              <g>
                {/* X axis */}
                <line
                  x1={origin.x} y1={origin.y}
                  x2={xEnd.x} y2={xEnd.y}
                  stroke={getDimensionColor(xAxis)}
                  strokeWidth="3"
                  opacity="0.7"
                />
                <text
                  x={xEnd.x + 10} y={xEnd.y}
                  className="text-sm font-medium"
                  fill={getDimensionColor(xAxis)}
                >
                  {getDimensionLabel(xAxis)}
                </text>
                
                {/* Y axis */}
                <line
                  x1={origin.x} y1={origin.y}
                  x2={yEnd.x} y2={yEnd.y}
                  stroke={getDimensionColor(yAxis)}
                  strokeWidth="3"
                  opacity="0.7"
                />
                <text
                  x={yEnd.x + 10} y={yEnd.y}
                  className="text-sm font-medium"
                  fill={getDimensionColor(yAxis)}
                >
                  {getDimensionLabel(yAxis)}
                </text>
                
                {/* Z axis */}
                <line
                  x1={origin.x} y1={origin.y}
                  x2={zEnd.x} y2={zEnd.y}
                  stroke={getDimensionColor(zAxis)}
                  strokeWidth="3"
                  opacity="0.7"
                />
                <text
                  x={zEnd.x + 10} y={zEnd.y}
                  className="text-sm font-medium"
                  fill={getDimensionColor(zAxis)}
                >
                  {getDimensionLabel(zAxis)}
                </text>
              </g>
            );
          })()}
          
          {/* Model points with hover functionality */}
          {sortedPoints.map((point) => {
            const size = Math.max(6, Math.min(14, point.evaluationCount / 10 + 6));
            const opacity = 0.7 + (point.projected.z + 1) * 0.15; // Depth-based opacity
            const isHovered = hoveredModel === point.id;
            
            return (
              <g key={point.id}>
                <circle
                  cx={point.projected.x}
                  cy={point.projected.y}
                  r={isHovered ? size + 2 : size}
                  fill={point.color}
                  stroke={isHovered ? "#FFD700" : "white"}
                  strokeWidth={isHovered ? "3" : "2"}
                  opacity={opacity}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredModel(point.id)}
                  onMouseLeave={() => setHoveredModel(null)}
                />
                {/* Only show text when hovered to reduce clutter */}
                {isHovered && (
                  <text
                    x={point.projected.x + size + 8}
                    y={point.projected.y - 5}
                    className="text-xs font-medium fill-white pointer-events-none"
                    style={{ fontSize: '11px' }}
                  >
                    {point.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        
        {/* Hover tooltip */}
        {hoveredModel && (() => {
          const hoveredPoint = sortedPoints.find(p => p.id === hoveredModel);
          if (!hoveredPoint) return null;
          
          return (
            <div className="absolute top-4 left-4 bg-neural-dark/90 border border-gray-600 rounded-lg p-3 max-w-xs">
              <h4 className="font-semibold text-white text-sm">{hoveredPoint.name}</h4>
              <p className="text-xs text-gray-300 mb-2">{hoveredPoint.company}</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Personality:</span>
                  <span className="text-white font-mono">{hoveredPoint.archetype}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Evaluations:</span>
                  <span className="text-white">{hoveredPoint.evaluationCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{getDimensionLabel(xAxis).split(' ')[0]}:</span>
                  <span className="text-white">{(hoveredPoint.behavioralScores[xAxis] || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{getDimensionLabel(yAxis).split(' ')[0]}:</span>
                  <span className="text-white">{(hoveredPoint.behavioralScores[yAxis] || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{getDimensionLabel(zAxis).split(' ')[0]}:</span>
                  <span className="text-white">{(hoveredPoint.behavioralScores[zAxis] || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          );
        })()}
        
        {/* Controls overlay */}
        <div className="absolute bottom-4 right-4 bg-neural-dark/80 rounded p-2 text-xs text-neutral-muted">
          <p>Drag to rotate • Scroll to zoom</p>
          <p>Rotation: X:{rotation.x.toFixed(0)}° Y:{rotation.y.toFixed(0)}°</p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neural-dark/30 rounded p-3">
          <h4 className="text-sm font-semibold text-neutral-light mb-2">Archetype Colors</h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-neutral-muted">Resistant (R)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-xs text-neutral-muted">Selective (S)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-neutral-muted">Compliant (C)</span>
            </div>
          </div>
        </div>
        
        <div className="bg-neural-dark/30 rounded p-3">
          <h4 className="text-sm font-semibold text-neutral-light mb-2">Point Size</h4>
          <p className="text-xs text-neutral-muted">
            Larger points = More evaluations
          </p>
        </div>
        
        <div className="bg-neural-dark/30 rounded p-3">
          <h4 className="text-sm font-semibold text-neutral-light mb-2">Depth</h4>
          <p className="text-xs text-neutral-muted">
            Brighter = Closer to viewer
          </p>
        </div>
      </div>
    </Card>
  );
};
