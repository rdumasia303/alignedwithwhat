import React from 'react';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface RiskMatrixProps {
  data?: any;
  isLoading?: boolean;
}

export const RiskMatrix: React.FC<RiskMatrixProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return <LoadingSpinner text="Analyzing risk factors..." />;
  }

  // Extract real risk data from AVM analysis
  const firstModel = data?.models ? Object.values(data.models)[0] as any : null;
  const riskCategories = firstModel ? [
    { name: 'Complicity Risk', level: firstModel.behavioral_scores?.complicity > 0.7 ? 'high' : firstModel.behavioral_scores?.complicity > 0.4 ? 'medium' : 'low', value: Math.round((firstModel.behavioral_scores?.complicity || 0) * 100), color: 'bg-red-500' },
    { name: 'Authority Deference', level: firstModel.behavioral_scores?.authority > 0.6 ? 'high' : 'medium', value: Math.round((firstModel.behavioral_scores?.authority || 0) * 100), color: 'bg-yellow-500' },
    { name: 'Consistency Score', level: firstModel.behavioral_scores?.consistency > 0.8 ? 'high' : 'medium', value: Math.round((firstModel.behavioral_scores?.consistency || 0) * 100), color: 'bg-green-500' },
    { name: 'Firmness Level', level: firstModel.behavioral_scores?.firmness > 0.8 ? 'high' : 'medium', value: Math.round((firstModel.behavioral_scores?.firmness || 0) * 100), color: 'bg-blue-500' },
    { name: 'Outcome Focus', level: firstModel.behavioral_scores?.outcome_focus > 0.5 ? 'medium' : 'low', value: Math.round((firstModel.behavioral_scores?.outcome_focus || 0) * 100), color: 'bg-purple-500' },
  ] : [
    { name: 'Bias Amplification', level: 'high', value: 85, color: 'bg-red-500' },
    { name: 'Misinformation', level: 'medium', value: 60, color: 'bg-yellow-500' },
    { name: 'Privacy Concerns', level: 'low', value: 30, color: 'bg-green-500' },
    { name: 'Manipulation', level: 'high', value: 75, color: 'bg-red-500' },
    { name: 'Inconsistency', level: 'medium', value: 45, color: 'bg-yellow-500' },
  ];

  return (
    <div className="space-y-4">
      {riskCategories.map((risk) => (
        <div key={risk.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neural-light">{risk.name}</span>
            <span className={`text-xs px-2 py-1 rounded ${
              risk.level === 'high' ? 'bg-red-500/20 text-red-400' :
              risk.level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {risk.value}%
            </span>
          </div>
          <div className="w-full bg-neural-darker rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${risk.color}`}
              style={{ width: `${risk.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
