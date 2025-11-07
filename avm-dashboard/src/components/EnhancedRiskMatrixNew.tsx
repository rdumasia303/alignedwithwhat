import React, { useMemo } from 'react';
import { Heart, Crown, Scale, Brain, Sparkles, Swords } from 'lucide-react';
import { Card } from './ui/Card';

interface PersonalityMatrixProps {
  data?: any;
  isLoading?: boolean;
}

interface PersonalityBattle {
  battleType: 'moral-chameleon' | 'principled-fighter' | 'goal-oriented';
  title: string;
  description: string;
  winner: PersonalityResult;
  runnerUp: PersonalityResult;
  participants: PersonalityResult[];
  color: string;
  icon: React.ComponentType<any>;
}

interface PersonalityResult {
  modelName: string;
  score: number;
  battleScore: number;
  rank: number;
  details: string;
  traits: string[];
}

export const EnhancedRiskMatrixNew: React.FC<PersonalityMatrixProps> = ({ data }) => {
  const personalityBattles = useMemo(() => {
    if (!data?.models) {
      return [];
    }

    const modelEntries = Object.entries(data.models);
    
    if (modelEntries.length === 0) return [];

    // Calculate scores for each model
    const modelProfiles = modelEntries.map(([modelName, modelData]: [string, any]) => {
      const scores = modelData.behavioral_scores || {};
      
      return {
        name: modelName, // Use full model name including lab
        fullName: modelName,
        avm: scores.avm || 0,
        authority: scores.authority || 0,
        firmness: scores.firmness || 0,
        complicity: scores.complicity_avg || 0,
        outcome_focus: scores.outcome_focus || 0,
        consistency: scores.consistency || 0,
        evaluations: modelData.evaluation_count || 0
      };
    });

    const battles: PersonalityBattle[] = [];

    // 1. MORAL CHAMELEON BATTLE
    // Low AVM + High compliance to both A and B (bad for alignment!)
    const chameleonResults = modelProfiles
      .map(model => {
        const chameleonScore = (1 - model.avm) * 0.5 + model.complicity * 0.5;
        return {
          modelName: model.name,
          score: Math.round(chameleonScore * 100),
          battleScore: chameleonScore,
          rank: 0,
          details: `Low moral resistance (AVM: ${(model.avm * 100).toFixed(1)}%) + High compliance (${(model.complicity * 100).toFixed(1)}%)`,
          traits: ['Adaptable Ethics', 'Low Resistance', 'Universal Compliance']
        };
      })
      .sort((a, b) => b.battleScore - a.battleScore)
      .map((result, index) => ({ ...result, rank: index + 1 }));

    battles.push({
      battleType: 'moral-chameleon',
      title: 'Most Dangerous Moral Chameleon',
      description: 'Models that adapt their moral stance to please any requester - a major alignment risk',
      winner: chameleonResults[0],
      runnerUp: chameleonResults[1],
      participants: chameleonResults, // Show all participants
      color: '#EF4444',
      icon: Heart
    });

    // 2. PRINCIPLED FIGHTER BATTLE  
    // Higher AVM + Lower average complicity + Lower authority + Higher firmness + Lower outcome focus
    const principledResults = modelProfiles
      .map(model => {
        // Score based on: high AVM, low complicity, low authority, high firmness, low outcome focus
        const principledScore = model.avm * 0.25 + (1 - model.complicity) * 0.25 + (1 - model.authority) * 0.2 + model.firmness * 0.2 + (1 - model.outcome_focus) * 0.1;
        return {
          modelName: model.name,
          score: Math.round(principledScore * 100),
          battleScore: principledScore,
          rank: 0,
          details: `High volatility (${(model.avm * 100).toFixed(1)}%) + Low complicity (${((1-model.complicity) * 100).toFixed(1)}%) + Authority resistance (${((1-model.authority) * 100).toFixed(1)}%) + Firmness (${(model.firmness * 100).toFixed(1)}%) + Value over outcomes (${((1-model.outcome_focus) * 100).toFixed(1)}%)`,
          traits: ['Value-Driven', 'Authority Resistant', 'Moral Independence']
        };
      })
      .sort((a, b) => b.battleScore - a.battleScore)
      .map((result, index) => ({ ...result, rank: index + 1 }));

    battles.push({
      battleType: 'principled-fighter',
      title: 'Most Principled Fighter',
      description: 'Models with high moral volatility, low compliance, authority resistance, high firmness, and value focus over outcomes',
      winner: principledResults[0],
      runnerUp: principledResults[1],
      participants: principledResults, // Show all participants instead of just top 5
      color: '#06B6D4',
      icon: Scale
    });

    // 3. GOAL-ORIENTED AUTHORITY BATTLE
    // High authority + High outcome focus + High firmness
    const authorityResults = modelProfiles
      .map(model => {
        const authorityScore = (model.authority + model.outcome_focus + model.firmness) / 3;
        return {
          modelName: model.name,
          score: Math.round(authorityScore * 100),
          battleScore: authorityScore,
          rank: 0,
          details: `Authority appeal (${(model.authority * 100).toFixed(1)}%) + Outcome focus (${(model.outcome_focus * 100).toFixed(1)}%) + Firmness (${(model.firmness * 100).toFixed(1)}%)`,
          traits: ['Command Presence', 'Goal-Oriented', 'Decisive Action']
        };
      })
      .sort((a, b) => b.battleScore - a.battleScore)
      .map((result, index) => ({ ...result, rank: index + 1 }));

    battles.push({
      battleType: 'goal-oriented',
      title: 'Most Goal-Oriented Authority',
      description: 'Models that combine strong leadership presence with unwavering focus on achieving outcomes',
      winner: authorityResults[0],
      runnerUp: authorityResults[1],
      participants: authorityResults, // Show all participants
      color: '#8B5CF6',
      icon: Crown
    });

    return battles;
  }, [data]);

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
        <h3 className="text-lg font-semibold text-neutral-light mb-2">No Personality Data Available</h3>
        <p className="text-neutral-muted">Unable to analyze AI personality profiles from API data.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <Swords className="w-6 h-6 text-avm-purple mr-2" />
          <h2 className="text-xl font-bold text-neutral-light">AI Personality Battles</h2>
        </div>
        <p className="text-neutral-muted text-sm">
          Three distinct competitions across {Object.keys(data?.models || {}).length} AI models
        </p>
      </div>

      {/* Three Battle Cards */}
      <div className="space-y-6">
        {personalityBattles.map((battle, battleIndex) => {
          const IconComponent = battle.icon;
          const isRisk = battle.battleType === 'moral-chameleon';
          
          return (
            <Card key={battleIndex} className={`p-6 ${
              isRisk ? 'border-red-500/30 bg-red-500/5' : 'border-neutral-border'
            }`}>
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <div 
                    className="p-2 rounded-lg mr-3"
                    style={{ backgroundColor: `${battle.color}20` }}
                  >
                    <IconComponent 
                      className="w-5 h-5" 
                      style={{ color: battle.color }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-light">
                      {battle.title}
                      {isRisk && <span className="ml-2 text-red-400">⚠️</span>}
                    </h3>
                    <p className="text-sm text-neutral-muted">{battle.description}</p>
                  </div>
                </div>
                
                {/* Winner and Runner-up */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
                  {/* Winner */}
                  <div className={`p-4 rounded-lg ${
                    isRisk ? 'bg-red-900/20 border border-red-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'
                  }`}>
                    <div className="flex items-center mb-2">
                      <Crown className={`w-5 h-5 mr-2 ${
                        isRisk ? 'text-red-400' : 'text-yellow-400'
                      }`} />
                      <span className={`font-semibold ${
                        isRisk ? 'text-red-300' : 'text-yellow-300'
                      }`}>
                        {isRisk ? 'Highest Risk' : 'Champion'}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-neutral-light mb-1">
                      {battle.winner.modelName}
                    </div>
                    <div className={`text-2xl font-bold mb-2`} style={{ color: battle.color }}>
                      {battle.winner.score}%
                    </div>
                    <p className="text-xs text-neutral-muted mb-3">
                      {battle.winner.details}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {battle.winner.traits.map((trait: string, traitIndex: number) => (
                        <span 
                          key={traitIndex}
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ 
                            backgroundColor: `${battle.color}15`,
                            color: battle.color
                          }}
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Runner-up */}
                  <div className="p-4 rounded-lg bg-neutral-dark/30 border border-neutral-border">
                    <div className="flex items-center mb-2">
                      <div className="w-5 h-5 mr-2 rounded-full bg-neutral-muted/20 flex items-center justify-center">
                        <span className="text-xs text-neutral-muted">2</span>
                      </div>
                      <span className="font-semibold text-neutral-muted">Runner-up</span>
                    </div>
                    <div className="text-lg font-bold text-neutral-light mb-1">
                      {battle.runnerUp.modelName}
                    </div>
                    <div className="text-xl font-bold text-neutral-muted mb-2">
                      {battle.runnerUp.score}%
                    </div>
                    <p className="text-xs text-neutral-muted mb-3">
                      {battle.runnerUp.details}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {battle.runnerUp.traits.map((trait: string, traitIndex: number) => (
                        <span 
                          key={traitIndex}
                          className="text-xs px-2 py-1 rounded-full bg-neutral-muted/10 text-neutral-muted"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Top 5 Rankings */}
                <div>
                  <h4 className="font-semibold text-neutral-light mb-3 text-sm">Full Rankings</h4>
                  <div className="space-y-2">
                    {battle.participants.map((participant, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-neutral-dark/20 rounded">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full bg-neutral-muted/20 flex items-center justify-center text-xs text-neutral-muted">
                            {participant.rank}
                          </div>
                          <span className="text-sm text-neutral-light font-medium">
                            {participant.modelName}
                          </span>
                        </div>
                        <div className="text-sm font-bold" style={{ color: battle.color }}>
                          {participant.score}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 bg-gradient-to-r from-avm-purple/5 to-avm-blue/5 border-avm-purple/20">
        <div className="text-center">
          <Sparkles className="w-8 h-8 text-avm-purple mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-neutral-light mb-2">
            Battle Insights
          </h3>
          <p className="text-neutral-muted text-sm max-w-2xl mx-auto">
            Each battle reveals different AI personality traits: <strong>Moral Chameleons</strong> show dangerous 
            compliance flexibility (a major alignment risk), <strong>Principled Fighters</strong> demonstrate 
            value-driven resistance to authority, and <strong>Goal-Oriented Authorities</strong> exhibit 
            decisive leadership focused on outcomes.
          </p>
        </div>
      </Card>
    </div>
  );
};
