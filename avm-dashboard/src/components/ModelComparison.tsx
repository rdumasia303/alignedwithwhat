import React from 'react';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface ModelComparisonProps {
  data?: any;
  isLoading?: boolean;
}

export const ModelComparison: React.FC<ModelComparisonProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return <LoadingSpinner text="Comparing AI models..." />;
  }

  // Extract real model data from AVM analysis
  const models = data?.models ? Object.entries(data.models).slice(0, 4).map(([modelName, modelData]: [string, any]) => ({
    name: modelName,
    empathy: Math.round((1 - (modelData.behavioral_scores?.complicity || 0)) * 100), // Lower complicity = more empathetic
    logic: Math.round((modelData.behavioral_scores?.firmness || 0) * 100),
    creativity: Math.round((modelData.behavioral_scores?.outcome_focus || 0) * 100),
    risk: Math.round((modelData.behavioral_scores?.complicity || 0) * 100), // Higher complicity = higher risk
  })) : [
    { name: 'GPT-4', empathy: 85, logic: 95, creativity: 80, risk: 25 },
    { name: 'Claude-3', empathy: 90, logic: 88, creativity: 85, risk: 20 },
    { name: 'Gemini Pro', empathy: 75, logic: 92, creativity: 75, risk: 30 },
    { name: 'Mistral', empathy: 70, logic: 90, creativity: 70, risk: 35 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {models.map((model) => (
          <div key={model.name} className="bg-neural-darker/50 p-4 rounded-lg border border-neural-light/10">
            <h4 className="font-semibold text-neural-light mb-3">{model.name}</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neural-muted">Empathy</span>
                <span className="text-avm-purple">{model.empathy}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neural-muted">Logic</span>
                <span className="text-avm-cyan">{model.logic}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neural-muted">Creativity</span>
                <span className="text-green-400">{model.creativity}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neural-muted">Risk Factor</span>
                <span className="text-red-400">{model.risk}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
