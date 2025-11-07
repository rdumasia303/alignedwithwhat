import React from 'react';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface PersonalityRadarProps {
  data?: any;
  isLoading?: boolean;
  detailed?: boolean;
}

export const PersonalityRadar: React.FC<PersonalityRadarProps> = ({ 
  data, 
  isLoading, 
  detailed = false 
}) => {
  if (isLoading) {
    return <LoadingSpinner text="Loading personality data..." />;
  }

  // Extract real traits from AVM data
  const firstModel = data?.models ? Object.values(data.models)[0] as any : null;
  const traits = firstModel ? [
    { name: 'Complicity', value: Math.round((firstModel.behavioral_scores?.complicity || 0) * 100), color: '#8B5CF6' },
    { name: 'Firmness', value: Math.round((firstModel.behavioral_scores?.firmness || 0) * 100), color: '#06B6D4' },
    { name: 'Authority', value: Math.round((firstModel.behavioral_scores?.authority || 0) * 100), color: '#10B981' },
    { name: 'Outcome Focus', value: Math.round((firstModel.behavioral_scores?.outcome_focus || 0) * 100), color: '#F59E0B' },
    { name: 'Consistency', value: Math.round((firstModel.behavioral_scores?.consistency || 0) * 100), color: '#EF4444' },
  ] : [
    { name: 'Complicity', value: 0, color: '#8B5CF6' },
    { name: 'Firmness', value: 0, color: '#06B6D4' },
    { name: 'Authority', value: 0, color: '#10B981' },
    { name: 'Outcome Focus', value: 0, color: '#F59E0B' },
    { name: 'Consistency', value: 0, color: '#EF4444' },
  ];

  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      <svg width="100%" height="100%" viewBox="0 0 300 300" className="max-w-xs">
        {/* Background circles */}
        {[1, 2, 3, 4, 5].map(level => (
          <circle
            key={level}
            cx="150"
            cy="150"
            r={level * 20}
            fill="none"
            stroke="rgba(139, 92, 246, 0.1)"
            strokeWidth="1"
          />
        ))}
        
        {/* Trait lines and points */}
        {traits.map((trait, index) => {
          const angle = (index * 2 * Math.PI) / traits.length - Math.PI / 2;
          const radius = (trait.value / 100) * 100;
          const x = 150 + Math.cos(angle) * radius;
          const y = 150 + Math.sin(angle) * radius;
          const labelX = 150 + Math.cos(angle) * 120;
          const labelY = 150 + Math.sin(angle) * 120;
          
          return (
            <g key={trait.name}>
              {/* Axis line */}
              <line
                x1="150"
                y1="150"
                x2={150 + Math.cos(angle) * 100}
                y2={150 + Math.sin(angle) * 100}
                stroke="rgba(139, 92, 246, 0.2)"
                strokeWidth="1"
              />
              
              {/* Data point */}
              <circle
                cx={x}
                cy={y}
                r="4"
                fill={trait.color}
                className="animate-pulse"
              />
              
              {/* Label */}
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                className="text-xs fill-neural-light font-medium"
              >
                {trait.name}
              </text>
              
              {detailed && (
                <text
                  x={labelX}
                  y={labelY + 12}
                  textAnchor="middle"
                  className="text-xs fill-neural-muted"
                >
                  {trait.value}%
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
