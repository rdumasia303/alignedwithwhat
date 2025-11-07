import React from 'react';
import { Activity } from 'lucide-react';

interface RealtimeMetricsProps {
  className?: string;
  data?: any;
}

export const RealtimeMetrics: React.FC<RealtimeMetricsProps> = ({ className = '', data }) => {
  const modelCount = data?.global_statistics?.total_models || 7;
  const evaluationCount = data?.global_statistics?.total_evaluations_analyzed || 899;
  
  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <Activity className="w-4 h-4 text-green-500" />
        <span className="text-sm text-neural-light">{modelCount} AI Models • {evaluationCount} Conflicts Tested</span>
      </div>
    </div>
  );
};
