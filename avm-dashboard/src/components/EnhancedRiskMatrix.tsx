import React, { useMemo, useRef } from 'react';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, Zap, Brain, Target } from 'lucide-react';

interface RiskMatrixProps {
  data?: any;
  isLoading?: boolean;
}

export const EnhancedRiskMatrix: React.FC<RiskMatrixProps> = ({ data, isLoading }) => {
  const pulseRef = useRef<HTMLDivElement>(null);

  const riskFactors = useMemo(() => {
    if (!data?.models) {
      // Demo data with realistic threat scenarios
      return [
        {
          name: 'Moral Chameleon Risk',
          level: 'critical' as const,
          value: 89,
          color: '#EF4444',
          icon: Brain,
          description: 'AI adapts moral stance based on who\'s asking',
          trend: 'up' as const
        },
        {
          name: 'Authority Compliance',
          level: 'high' as const,
          value: 76,
          color: '#F59E0B',
          icon: Shield,
          description: 'Excessive deference to perceived authority figures',
          trend: 'stable' as const
        },
        {
          name: 'Consistency Breach',
          level: 'medium' as const,
          value: 58,
          color: '#FCD34D',
          icon: Target,
          description: 'Contradictory responses in similar scenarios',
          trend: 'down' as const
        },
        {
          name: 'Manipulation Vectors',
          level: 'high' as const,
          value: 72,
          color: '#F59E0B',
          icon: Zap,
          description: 'Susceptible to prompt engineering attacks',
          trend: 'up' as const
        },
        {
          name: 'Safety Safeguards',
          level: 'medium' as const,
          value: 45,
          color: '#10B981',
          icon: Shield,
          description: 'Robustness of built-in safety measures',
          trend: 'stable' as const
        }
      ];
    }

    // Calculate real risk factors from model data
    const modelEntries = Object.entries(data.models);
    const avgComplicity = modelEntries.reduce((sum, [_, model]: [string, any]) => 
      sum + (model.behavioral_scores?.complicity || 0), 0) / modelEntries.length;
    const avgConsistency = modelEntries.reduce((sum, [_, model]: [string, any]) => 
      sum + (model.behavioral_scores?.consistency || 0), 0) / modelEntries.length;
    const avgAuthority = modelEntries.reduce((sum, [_, model]: [string, any]) => 
      sum + (model.behavioral_scores?.authority || 0), 0) / modelEntries.length;
    const avgFirmness = modelEntries.reduce((sum, [_, model]: [string, any]) => 
      sum + (model.behavioral_scores?.firmness || 0), 0) / modelEntries.length;

    return [
      {
        name: 'Moral Chameleon Risk',
        level: avgComplicity > 0.7 ? 'critical' : avgComplicity > 0.5 ? 'high' : avgComplicity > 0.3 ? 'medium' : 'low',
        value: Math.round(avgComplicity * 100),
        color: avgComplicity > 0.7 ? '#EF4444' : avgComplicity > 0.5 ? '#F59E0B' : '#FCD34D',
        icon: Brain,
        description: 'Average model willingness to help conflicting sides',
        trend: 'stable' as const
      },
      {
        name: 'Authority Compliance',
        level: avgAuthority > 0.7 ? 'high' : avgAuthority > 0.5 ? 'medium' : 'low',
        value: Math.round(avgAuthority * 100),
        color: avgAuthority > 0.7 ? '#F59E0B' : avgAuthority > 0.5 ? '#FCD34D' : '#10B981',
        icon: Shield,
        description: 'Susceptibility to authority-based manipulation',
        trend: 'stable' as const
      },
      {
        name: 'Consistency Score',
        level: avgConsistency > 0.7 ? 'safe' : avgConsistency > 0.5 ? 'medium' : 'high',
        value: Math.round(avgConsistency * 100),
        color: avgConsistency > 0.7 ? '#10B981' : avgConsistency > 0.5 ? '#FCD34D' : '#EF4444',
        icon: Target,
        description: 'Reliability of moral reasoning across scenarios',
        trend: 'stable' as const
      },
      {
        name: 'Decision Firmness',
        level: avgFirmness > 0.7 ? 'safe' : avgFirmness > 0.5 ? 'medium' : 'high',
        value: Math.round(avgFirmness * 100),
        color: avgFirmness > 0.7 ? '#10B981' : avgFirmness > 0.5 ? '#FCD34D' : '#EF4444',
        icon: Zap,
        description: 'Resistance to persuasion and manipulation',
        trend: 'stable' as const
      }
    ];
  }, [data]);

  const overallRiskLevel = useMemo(() => {
    const criticalCount = riskFactors.filter(r => r.level === 'critical').length;
    const highCount = riskFactors.filter(r => r.level === 'high').length;
    
    if (criticalCount > 0) return 'critical';
    if (highCount > 1) return 'high';
    if (highCount > 0) return 'medium';
    return 'low';
  }, [riskFactors]);

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'critical': return 'CRITICAL';
      case 'high': return 'HIGH';
      case 'medium': return 'MEDIUM';
      case 'low': return 'LOW';
      case 'safe': return 'SAFE';
      default: return 'UNKNOWN';
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Analyzing threat vectors..." />;
  }

  return (
    <div className="space-y-6">
      {/* Overall Risk Status */}
      <motion.div 
        ref={pulseRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-lg border-2 relative overflow-hidden ${
          overallRiskLevel === 'critical' ? 'border-red-500 bg-red-500/10' :
          overallRiskLevel === 'high' ? 'border-orange-500 bg-orange-500/10' :
          overallRiskLevel === 'medium' ? 'border-yellow-500 bg-yellow-500/10' :
          'border-green-500 bg-green-500/10'
        }`}
      >
        {/* Animated background pulse for critical risks */}
        {overallRiskLevel === 'critical' && (
          <motion.div
            className="absolute inset-0 bg-red-500/5"
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-neural-light mb-2">
              🚨 Fleet Risk Assessment
            </h3>
            <p className="text-neural-muted">
              Real-time analysis of {Object.keys(data?.models || {}).length} AI models
            </p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${
              overallRiskLevel === 'critical' ? 'text-red-400' :
              overallRiskLevel === 'high' ? 'text-orange-400' :
              overallRiskLevel === 'medium' ? 'text-yellow-400' :
              'text-green-400'
            }`}>
              {getRiskLabel(overallRiskLevel)}
            </div>
            <div className="text-sm text-neural-muted">Risk Level</div>
          </div>
        </div>
      </motion.div>

      {/* Risk Factor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {riskFactors.map((factor, index) => (
          <motion.div
            key={factor.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-neural-darker/50 p-4 rounded-lg border border-neutral-light/10 hover:border-avm-purple/30 transition-colors group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${factor.color}20` }}
                >
                  <factor.icon 
                    className="w-5 h-5" 
                    style={{ color: factor.color }}
                  />
                </div>
                <div>
                  <h4 className="font-medium text-neural-light group-hover:text-avm-purple transition-colors">
                    {factor.name}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span 
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        factor.level === 'critical' ? 'bg-red-500/20 text-red-400' :
                        factor.level === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        factor.level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        factor.level === 'low' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {getRiskLabel(factor.level)}
                    </span>
                    <span className="text-xs text-neural-muted">
                      {factor.trend === 'up' ? '↗️' : factor.trend === 'down' ? '↘️' : '➡️'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-neural-light">
                  {factor.value}%
                </div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-neural-dark rounded-full h-2 mb-2">
              <motion.div 
                className="h-2 rounded-full"
                style={{ backgroundColor: factor.color }}
                initial={{ width: 0 }}
                animate={{ width: `${factor.value}%` }}
                transition={{ duration: 1, delay: index * 0.2 }}
              />
            </div>
            
            <p className="text-xs text-neural-muted">
              {factor.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-neural-darker/50 p-4 rounded-lg border border-neural-light/10"
      >
        <h4 className="font-medium text-neural-light mb-3 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 text-avm-orange" />
          Recommended Actions
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {overallRiskLevel === 'critical' && (
            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded text-red-400 text-sm">
              🚨 <strong>Immediate:</strong> Review high-risk models for production use
            </div>
          )}
          {riskFactors.some(f => f.level === 'high') && (
            <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded text-orange-400 text-sm">
              ⚠️ <strong>Priority:</strong> Implement additional safety guardrails
            </div>
          )}
          <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded text-blue-400 text-sm">
            📊 <strong>Monitor:</strong> Track behavioral consistency over time
          </div>
        </div>
      </motion.div>
    </div>
  );
};
