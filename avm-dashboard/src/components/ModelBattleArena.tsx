import React, { useState } from 'react';
import { Shield, Zap, Target, Award, AlertTriangle, Users, Brain, Settings, TrendingUp, TrendingDown, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from './ui/Card';

interface ModelBattleArenaProps {
  data?: any;
  isLoading?: boolean;
}

interface BattlePreference {
  metric: string;
  preference: 'high' | 'low';
  weight: number;
  enabled: boolean;
}

export const ModelBattleArena: React.FC<ModelBattleArenaProps> = ({ data, isLoading }) => {
  const [selectedModel1, setSelectedModel1] = useState<string>('');
  const [selectedModel2, setSelectedModel2] = useState<string>('');
  const [battlePreferences, setBattlePreferences] = useState<BattlePreference[]>([
    { metric: 'avm', preference: 'high', weight: 1, enabled: true },
    { metric: 'complicity_avg', preference: 'low', weight: 1, enabled: true },
    { metric: 'complicity_a', preference: 'low', weight: 1, enabled: false },
    { metric: 'complicity_b', preference: 'low', weight: 1, enabled: false },
    { metric: 'authority', preference: 'low', weight: 1, enabled: true },
    { metric: 'firmness', preference: 'high', weight: 1, enabled: true },
    { metric: 'outcome_focus', preference: 'high', weight: 1, enabled: true }
  ]);
  const [selectedFilter, setSelectedFilter] = useState<{
    type: 'scenario_type' | 'severity_level' | 'power_dynamic' | null;
    value: string;
  }>({ type: null, value: '' });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-avm-purple"></div>
      </div>
    );
  }

  if (!data || !data.models) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-neutral-light mb-2">No Model Data Available</h3>
        <p className="text-neutral-muted">Unable to load model comparison data from the API.</p>
      </Card>
    );
  }

  // Extract real model data with correct API structure
  const models = data.models || {};
  
  const modelEntries = Object.entries(models).map(([name, modelData]: [string, any]) => ({
    id: name,
    name: name.split(':')[1]?.trim() || name,
    company: name.split(':')[0]?.trim() || 'Unknown',
    // Use correct API structure
    avm: modelData.behavioral_scores?.avm || 0,
    complicity_avg: modelData.behavioral_scores?.complicity_avg || 0,
    complicity_a: modelData.behavioral_scores?.complicity_a || 0,
    complicity_b: modelData.behavioral_scores?.complicity_b || 0,
    authority: modelData.behavioral_scores?.authority || 0,
    firmness: modelData.behavioral_scores?.firmness || 0,
    outcome_focus: modelData.behavioral_scores?.outcome_focus || 0,
    consistency: modelData.behavioral_scores?.consistency || 0,
    archetype: modelData.mean_personality?.code || 'Unknown',
    evaluation_count: modelData.evaluation_count || 0,
    categorical_analysis: modelData.categorical_analysis || {}
  })).sort((a, b) => a.complicity_avg - b.avm);

  const getModel = (id: string) => modelEntries.find(m => m.id === id);
  const model1 = getModel(selectedModel1);
  const model2 = getModel(selectedModel2);
  const bothModelsSelected = model1 && model2;

  // Helper functions
  const getMetricDisplayName = (metric: string) => {
    const names = {
      'avm': 'Alignment Volatility (AVM)',
      'complicity_avg': 'Average Complicity',
      'complicity_a': 'Complicity A (Powerful Side)',
      'complicity_b': 'Complicity B (Less Powerful Side)',
      'authority': 'Authority Appeal',
      'firmness': 'Response Firmness',
      'outcome_focus': 'Outcome Focus'
    };
    return names[metric as keyof typeof names] || metric;
  };

  const compareMetric = (val1: number, val2: number, lowerIsBetter = false) => {
    if (Math.abs(val1 - val2) < 0.01) return 'tie';
    if (lowerIsBetter) {
      return val1 < val2 ? 'model1' : 'model2';
    }
    return val1 > val2 ? 'model1' : 'model2';
  };

  // Battle calculation using filtered data
  const calculateBattleWinner = () => {
    if (!model1 || !model2) return { winner: null, score1: 0, score2: 0, details: [] };
    
    // Get filtered behavioral scores for both models
    const scores1 = getFilteredModelData(model1);
    const scores2 = getFilteredModelData(model2);
    
    let score1 = 0;
    let score2 = 0;
    const details = [];

    const enabledPreferences = battlePreferences.filter(pref => pref.enabled);

    for (const pref of enabledPreferences) {
      const val1 = Number(scores1[pref.metric as keyof typeof scores1]) || 0;
      const val2 = Number(scores2[pref.metric as keyof typeof scores2]) || 0;
      
      let winner;
      if (pref.preference === 'low') {
        winner = val1 < val2 ? 'model1' : val2 < val1 ? 'model2' : 'tie';
      } else {
        winner = val1 > val2 ? 'model1' : val2 > val1 ? 'model2' : 'tie';
      }
      
      if (winner === 'model1') score1 += pref.weight;
      else if (winner === 'model2') score2 += pref.weight;
      
      details.push({
        metric: pref.metric,
        preference: pref.preference,
        val1,
        val2,
        winner,
        weight: pref.weight
      });
    }

    const overall = score1 > score2 ? 'model1' : score2 > score1 ? 'model2' : 'tie';
    return { winner: overall, score1, score2, details };
  };

  // Get filtered model data based on selected filter
  const getFilteredModelData = (model: any) => {
    const defaultScores = {
      avm: 0,
      complicity_avg: 0,
      complicity_a: 0,
      complicity_b: 0,
      authority: 0,
      firmness: 0,
      outcome_focus: 0
    };

    if (!model) return defaultScores;

    if (!selectedFilter.type || !selectedFilter.value) {
      return {
        avm: model.avm || model.behavioral_scores?.avm || 0,
        complicity_avg: model.complicity_avg || model.behavioral_scores?.complicity_avg || 0,
        complicity_a: model.complicity_a || model.behavioral_scores?.complicity_a || 0,
        complicity_b: model.complicity_b || model.behavioral_scores?.complicity_b || 0,
        authority: model.authority || model.behavioral_scores?.authority || 0,
        firmness: model.firmness || model.behavioral_scores?.firmness || 0,
        outcome_focus: model.outcome_focus || model.behavioral_scores?.outcome_focus || 0
      };
    }

    const categoricalAnalysis = model.categorical_analysis || {};
    const filterData = categoricalAnalysis[selectedFilter.type + 's']?.[selectedFilter.value];
    
    if (!filterData) {
      return {
        avm: model.avm || model.behavioral_scores?.avm || 0,
        complicity_avg: model.complicity_avg || model.behavioral_scores?.complicity_avg || 0,
        complicity_a: model.complicity_a || model.behavioral_scores?.complicity_a || 0,
        complicity_b: model.complicity_b || model.behavioral_scores?.complicity_b || 0,
        authority: model.authority || model.behavioral_scores?.authority || 0,
        firmness: model.firmness || model.behavioral_scores?.firmness || 0,
        outcome_focus: model.outcome_focus || model.behavioral_scores?.outcome_focus || 0
      };
    }

    // Return the filtered scores from categorical analysis
    return {
      avm: filterData.avg_avm || 0,
      complicity_avg: filterData.avg_complicity || 0,
      complicity_a: filterData.avg_complicity_a || 0,
      complicity_b: filterData.avg_complicity_b || 0,
      authority: filterData.avg_authority || 0,
      firmness: filterData.avg_firmness || 0,
      outcome_focus: filterData.avg_outcome_focus || 0
    };
  };

  // Available filters from categorical analysis data
  const getFilterOptions = () => {
    const options = {
      scenario_types: new Set<string>(),
      severity_levels: new Set<string>(),
      power_dynamics: new Set<string>()
    };

    // Collect unique filter values from all models' categorical analysis
    Object.values(models).forEach((modelData: any) => {
      const categoricalAnalysis = modelData.categorical_analysis || {};
      
      if (categoricalAnalysis.scenario_types) {
        Object.keys(categoricalAnalysis.scenario_types).forEach(type => options.scenario_types.add(type));
      }
      if (categoricalAnalysis.severity_levels) {
        Object.keys(categoricalAnalysis.severity_levels).forEach(level => options.severity_levels.add(level));
      }
      if (categoricalAnalysis.power_dynamics) {
        Object.keys(categoricalAnalysis.power_dynamics).forEach(dynamic => options.power_dynamics.add(dynamic));
      }
    });

    return {
      scenario_types: Array.from(options.scenario_types).sort(),
      severity_levels: Array.from(options.severity_levels).sort(),
      power_dynamics: Array.from(options.power_dynamics).sort()
    };
  };

  const filterOptions = getFilterOptions();

  const updateBattlePreference = (metric: string, field: 'preference' | 'enabled', value: any) => {
    setBattlePreferences(prev => 
      prev.map(p => p.metric === metric ? { ...p, [field]: value } : p)
    );
  };

  const battleResult = calculateBattleWinner();

  return (
    <div className="space-y-6">
      {/* Battle Arena Header */}
      {bothModelsSelected && (
        <Card className="p-6 bg-gradient-to-r from-gold/10 to-amber-500/10 border-gold/20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-gold mr-3" />
              <h3 className="text-2xl font-bold text-neutral-light">Battle Arena: Model Comparison</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Model 1 */}
              <div className="text-center">
                <div className="p-6 bg-gradient-to-br from-avm-purple/20 to-avm-purple/5 rounded-lg border border-avm-purple/30">
                  <div className="text-3xl mb-2">🤖</div>
                  <h4 className="text-xl font-bold text-white mb-2">{model1.name}</h4>
                  <div className="text-sm text-gray-400 mb-4">{model1.company}</div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-gray-300">
                      Archetype: {model1.archetype}
                    </div>
                    <div className="text-xs text-gray-400">
                      AVM: {model1.avm.toFixed(3)}
                    </div>
                  </div>
                </div>
              </div>

              {/* VS */}
              <div className="flex items-center justify-center">
                <div className="text-4xl font-bold text-avm-purple animate-pulse">VS</div>
              </div>

              {/* Model 2 */}
              <div className="text-center">
                <div className="p-6 bg-gradient-to-br from-avm-cyan/20 to-avm-cyan/5 rounded-lg border border-avm-cyan/30">
                  <div className="text-3xl mb-2">🤖</div>
                  <h4 className="text-xl font-bold text-white mb-2">{model2.name}</h4>
                  <div className="text-sm text-gray-400 mb-4">{model2.company}</div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-gray-300">
                      Archetype: {model2.archetype}
                    </div>
                    <div className="text-xs text-gray-400">
                      AVM: {model2.avm.toFixed(3)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Battle Configuration Panel */}
      {bothModelsSelected && (
        <Card className="p-6 bg-gradient-to-br from-avm-purple/10 to-avm-cyan/10 border-avm-purple/20">
          <h3 className="text-xl font-bold text-neutral-light mb-4 flex items-center">
            <Settings className="w-6 h-6 mr-2 text-avm-purple" />
            Battle Configuration
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Victory Conditions */}
            <div>
              <h4 className="text-lg font-semibold text-neutral-light mb-3">Victory Conditions</h4>
              <div className="text-xs text-neutral-muted mb-3 p-2 bg-neural-dark/30 rounded">
                <strong>AVM (Alignment Volatility):</strong> Average difference in complicity between how the model responds to the A and B prompts. Generally, the 'B' prompt represents the less powerful side, though in trivial scenarios and grey areas this doesn't necessarily mean it should be complied with.
              </div>
              <div className="space-y-3">
                {battlePreferences.map((pref) => (
                  <div key={pref.metric} className="p-3 bg-neural-dark/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={pref.enabled}
                          onChange={(e) => updateBattlePreference(pref.metric, 'enabled', e.target.checked)}
                          className="rounded border-gray-600 bg-gray-800 text-avm-purple focus:ring-avm-purple"
                        />
                        <span className="text-neutral-light font-medium">
                          {getMetricDisplayName(pref.metric)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateBattlePreference(pref.metric, 'preference', 'low')}
                          disabled={!pref.enabled}
                          className={`px-2 py-1 rounded text-xs ${
                            pref.preference === 'low' && pref.enabled
                              ? 'bg-green-600 text-white' 
                              : pref.enabled
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <TrendingDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => updateBattlePreference(pref.metric, 'preference', 'high')}
                          disabled={!pref.enabled}
                          className={`px-2 py-1 rounded text-xs ${
                            pref.preference === 'high' && pref.enabled
                              ? 'bg-blue-600 text-white' 
                              : pref.enabled
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <TrendingUp className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {pref.enabled && (
                      <div className="text-xs text-neutral-muted">
                        Victory by: {pref.preference === 'low' ? 'Lower values win' : 'Higher values win'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Context Filters */}
            <div>
              <h4 className="text-lg font-semibold text-neutral-light mb-3">Battle Context</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-neutral-muted mb-2">Filter Category</label>
                  <select
                    value={selectedFilter.type || ''}
                    onChange={(e) => setSelectedFilter({ 
                      type: e.target.value as 'scenario_type' | 'severity_level' | 'power_dynamic' | null || null, 
                      value: '' 
                    })}
                    className="w-full p-2 bg-neural-dark border border-gray-600 rounded text-white"
                  >
                    <option value="">All Scenarios (No Filter)</option>
                    <option value="scenario_type">By Scenario Type</option>
                    <option value="severity_level">By Severity Level</option>
                    <option value="power_dynamic">By Power Dynamic</option>
                  </select>
                </div>
                
                {selectedFilter.type && (
                  <div>
                    <label className="block text-sm text-neutral-muted mb-2">
                      Specific {selectedFilter.type.replace('_', ' ')}
                    </label>
                    <select
                      value={selectedFilter.value}
                      onChange={(e) => setSelectedFilter(prev => ({ ...prev, value: e.target.value }))}
                      className="w-full p-2 bg-neural-dark border border-gray-600 rounded text-white"
                    >
                      <option value="">Choose {selectedFilter.type.replace('_', ' ')}</option>
                      {selectedFilter.type === 'scenario_type' && filterOptions.scenario_types?.map((option: string) => (
                        <option key={option} value={option}>{option.replace('_', ' ')}</option>
                      ))}
                      {selectedFilter.type === 'severity_level' && filterOptions.severity_levels?.map((option: string) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                      {selectedFilter.type === 'power_dynamic' && filterOptions.power_dynamics?.map((option: string) => (
                        <option key={option} value={option}>{option.replace(/asymmetrical_power \(|\)/g, '').replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="text-xs text-neutral-muted p-2 bg-neural-dark/50 rounded">
                  <span className="font-medium">Note:</span> {selectedFilter.type && selectedFilter.value ? 
                    `Battle analysis is filtered to ${selectedFilter.type.replace('_', ' ')}: ${selectedFilter.value.replace('_', ' ')}` :
                    'Battle analysis includes all scenario data'
                  }
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Collapsed Model Selection (when both selected) */}
      {bothModelsSelected ? (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-avm-purple"></div>
                <span className="text-neutral-light font-medium">{model1.name}</span>
                <span className="text-xs text-neutral-muted">({model1.company})</span>
              </div>
              <span className="text-neutral-muted">VS</span>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-avm-cyan"></div>
                <span className="text-neutral-light font-medium">{model2.name}</span>
                <span className="text-xs text-neutral-muted">({model2.company})</span>
              </div>
            </div>
            <button
              onClick={() => { setSelectedModel1(''); setSelectedModel2(''); }}
              className="text-xs text-neutral-muted hover:text-neutral-light px-3 py-1 border border-gray-600 rounded"
            >
              Change Models
            </button>
          </div>
        </Card>
      ) : (
        /* Full Model Selection (when not both selected) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-neutral-light">
              <Brain className="w-5 h-5 mr-2 text-avm-purple" />
              Select First Model
            </h3>
            <div className="space-y-2">
              {modelEntries.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel1(model.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    selectedModel1 === model.id
                      ? 'border-avm-purple bg-avm-purple/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{model.name}</div>
                      <div className="text-sm text-gray-400">{model.company}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-neutral-light">
                        {model.archetype}
                      </div>
                      <div className="text-xs text-gray-500">AVM: {(model.avm * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-neutral-light">
              <Brain className="w-5 h-5 mr-2 text-avm-cyan" />
              Select Second Model
            </h3>
            <div className="space-y-2">
              {modelEntries.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel2(model.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    selectedModel2 === model.id
                      ? 'border-avm-cyan bg-avm-cyan/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{model.name}</div>
                      <div className="text-sm text-gray-400">{model.company}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-neutral-light">
                        {model.archetype}
                      </div>
                      <div className="text-xs text-gray-500">AVM: {(model.avm * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Battle Results - All comparison content when both models are selected */}
      {bothModelsSelected && (
        <div className="space-y-6">
          {/* Battle Winner Section */}
          <Card className="p-6 bg-gradient-to-r from-gold/10 to-amber-500/10 border-gold/20">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-gold mr-3" />
                <h3 className="text-2xl font-bold text-neutral-light">Battle Result</h3>
              </div>
              
              {(() => {
                const result = battleResult;
                if (result.winner === 'tie') {
                  return (
                    <div>
                      <div className="text-3xl font-bold text-neutral-light mb-2">Tie!</div>
                      <div className="text-lg text-neutral-muted mb-4">Both models scored equally ({result.score1.toFixed(1)} pts each)</div>
                    </div>
                  );
                }
                
                const winnerModel = result.winner === 'model1' ? model1 : model2;
                const winnerScore = result.winner === 'model1' ? result.score1 : result.score2;
                const loserScore = result.winner === 'model1' ? result.score2 : result.score1;

                return (
                  <div>
                    <div className="text-3xl font-bold text-gold mb-2">{winnerModel.name}</div>
                    <div className="text-lg text-neutral-light mb-4">
                      Victory Score: {winnerScore.toFixed(1)} vs {loserScore.toFixed(1)}
                    </div>
                    <div className="text-lg font-bold text-neutral-light">
                      Winner by your criteria
                    </div>
                  </div>
                );
              })()}
            </div>
          </Card>

          {/* Battle Details */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-neutral-light mb-4">Battle Breakdown</h3>
            <div className="space-y-4">
              {battleResult.details.map((detail, index) => (
                <div key={index} className="p-4 bg-neural-dark/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-neutral-light">
                      {getMetricDisplayName(detail.metric)}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm px-2 py-1 rounded ${
                        detail.preference === 'low' ? 'bg-green-900/30 text-green-300' : 'bg-blue-900/30 text-blue-300'
                      }`}>
                        {detail.preference === 'low' ? 'Lower Wins' : 'Higher Wins'}
                      </span>
                      <span className="text-sm text-neutral-muted">Weight: {detail.weight}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className={`p-2 rounded text-center ${
                      detail.winner === 'model1' ? 'bg-avm-purple/20 border border-avm-purple' : 'bg-gray-800'
                    }`}>
                      <div className="font-mono text-white">{detail.val1.toFixed(3)}</div>
                      <div className="text-xs text-gray-400">{model1.name}</div>
                    </div>
                    <div className="flex items-center justify-center">
                      {detail.winner === 'model1' && <ChevronLeft className="w-5 h-5 text-avm-purple" />}
                      {detail.winner === 'model2' && <ChevronRight className="w-5 h-5 text-avm-cyan" />}
                      {detail.winner === 'tie' && <span className="text-xs text-neutral-muted">TIE</span>}
                    </div>
                    <div className={`p-2 rounded text-center ${
                      detail.winner === 'model2' ? 'bg-avm-cyan/20 border border-avm-cyan' : 'bg-gray-800'
                    }`}>
                      <div className="font-mono text-white">{detail.val2.toFixed(3)}</div>
                      <div className="text-xs text-gray-400">{model2.name}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Detailed Metrics Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center text-neutral-light">
                <Shield className="w-5 h-5 mr-2 text-green-400" />
                Alignment & Complicity Metrics
                {selectedFilter.type && selectedFilter.value && (
                  <span className="ml-2 text-xs bg-avm-purple/20 text-avm-purple px-2 py-1 rounded">
                    Filtered: {selectedFilter.value.replace('_', ' ')}
                  </span>
                )}
              </h4>
              
              <div className="space-y-4">
                {(() => {
                  const scores1 = getFilteredModelData(model1);
                  const scores2 = getFilteredModelData(model2);
                  
                  return (
                    <>
                      {/* AVM Score Comparison */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-300">Alignment Volatility (AVM)</span>
                          {compareMetric(scores1.avm, scores2.avm) === 'model1' && <Award className="w-4 h-4 text-gold" />}
                          {compareMetric(scores1.avm, scores2.avm) === 'model2' && <Award className="w-4 h-4 text-gold" />}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className={`p-2 rounded text-center ${
                            compareMetric(scores1.avm, scores2.avm) === 'model1' ? 'bg-blue-900/30 border border-blue-600' : 'bg-gray-800'
                          }`}>
                            <div className="font-mono text-white">{scores1.avm.toFixed(3)}</div>
                            <div className="text-xs text-gray-400">{model1.name}</div>
                          </div>
                          <div className={`p-2 rounded text-center ${
                            compareMetric(scores1.avm, scores2.avm) === 'model2' ? 'bg-blue-900/30 border border-blue-600' : 'bg-gray-800'
                          }`}>
                            <div className="font-mono text-white">{scores2.avm.toFixed(3)}</div>
                            <div className="text-xs text-gray-400">{model2.name}</div>
                          </div>
                        </div>
                      </div>

                      {/* Complicity Score Comparison */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-300">Average Complicity</span>
                          {compareMetric(scores1.complicity_avg, scores2.complicity_avg, true) === 'model1' && <Award className="w-4 h-4 text-gold" />}
                          {compareMetric(scores1.complicity_avg, scores2.complicity_avg, true) === 'model2' && <Award className="w-4 h-4 text-gold" />}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className={`p-2 rounded text-center ${
                            compareMetric(scores1.complicity_avg, scores2.complicity_avg, true) === 'model1' ? 'bg-green-900/30 border border-green-600' : 'bg-gray-800'
                          }`}>
                            <div className="font-mono text-white">{scores1.complicity_avg.toFixed(3)}</div>
                            <div className="text-xs text-gray-400">{model1.name}</div>
                          </div>
                          <div className={`p-2 rounded text-center ${
                            compareMetric(scores1.complicity_avg, scores2.complicity_avg, true) === 'model2' ? 'bg-green-900/30 border border-green-600' : 'bg-gray-800'
                          }`}>
                            <div className="font-mono text-white">{scores2.complicity_avg.toFixed(3)}</div>
                            <div className="text-xs text-gray-400">{model2.name}</div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center text-neutral-light">
                <Target className="w-5 h-5 mr-2 text-blue-400" />
                Behavioral Characteristics
                {selectedFilter.type && selectedFilter.value && (
                  <span className="ml-2 text-xs bg-avm-cyan/20 text-avm-cyan px-2 py-1 rounded">
                    Filtered: {selectedFilter.value.replace('_', ' ')}
                  </span>
                )}
              </h4>
              
              <div className="space-y-4">
                {(() => {
                  const scores1 = getFilteredModelData(model1);
                  const scores2 = getFilteredModelData(model2);
                  
                  return (
                    <>
                      {/* Authority Score */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-300">Authority Appeal</span>
                          {compareMetric(scores1.authority, scores2.authority) === 'model1' && <Zap className="w-4 h-4 text-blue-400" />}
                          {compareMetric(scores1.authority, scores2.authority) === 'model2' && <Zap className="w-4 h-4 text-blue-400" />}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className={`p-2 rounded text-center ${
                            compareMetric(scores1.authority, scores2.authority) === 'model1' ? 'bg-blue-900/30 border border-blue-600' : 'bg-gray-800'
                          }`}>
                            <div className="font-mono text-white">{scores1.authority.toFixed(3)}</div>
                            <div className="text-xs text-gray-400">{model1.name}</div>
                          </div>
                          <div className={`p-2 rounded text-center ${
                            compareMetric(scores1.authority, scores2.authority) === 'model2' ? 'bg-blue-900/30 border border-blue-600' : 'bg-gray-800'
                          }`}>
                            <div className="font-mono text-white">{scores2.authority.toFixed(3)}</div>
                            <div className="text-xs text-gray-400">{model2.name}</div>
                          </div>
                        </div>
                      </div>

                      {/* Firmness Score */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-300">Response Firmness</span>
                          {compareMetric(scores1.firmness, scores2.firmness) === 'model1' && <Zap className="w-4 h-4 text-green-400" />}
                          {compareMetric(scores1.firmness, scores2.firmness) === 'model2' && <Zap className="w-4 h-4 text-green-400" />}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className={`p-2 rounded text-center ${
                            compareMetric(scores1.firmness, scores2.firmness) === 'model1' ? 'bg-green-900/30 border border-green-600' : 'bg-gray-800'
                          }`}>
                            <div className="font-mono text-white">{scores1.firmness.toFixed(3)}</div>
                            <div className="text-xs text-gray-400">{model1.name}</div>
                          </div>
                          <div className={`p-2 rounded text-center ${
                            compareMetric(scores1.firmness, scores2.firmness) === 'model2' ? 'bg-green-900/30 border border-green-600' : 'bg-gray-800'
                          }`}>
                            <div className="font-mono text-white">{scores2.firmness.toFixed(3)}</div>
                            <div className="text-xs text-gray-400">{model2.name}</div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </Card>
          </div>

          {/* Quick Stats Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border-avm-purple/20">
              <div className="flex items-center mb-4">
                <Brain className="w-6 h-6 text-avm-purple mr-2" />
                <h3 className="text-lg font-bold text-neutral-light">{model1.name}</h3>
                {selectedFilter.type && selectedFilter.value && (
                  <span className="ml-2 text-xs bg-avm-purple/20 text-avm-purple px-2 py-1 rounded">
                    {selectedFilter.value.replace('_', ' ')}
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {(() => {
                  const scores1 = getFilteredModelData(model1);
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-neutral-muted">Overall Complicity</span>
                        <span className="font-mono text-white">
                          {(scores1.complicity_avg * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-muted">Alignment Volatility</span>
                        <span className="font-mono text-white">{(scores1.avm * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-muted">Authority</span>
                        <span className="font-mono text-white">{(scores1.authority * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-muted">Firmness</span>
                        <span className="font-mono text-white">{(scores1.firmness * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-muted">Outcome Focus</span>
                        <span className="font-mono text-white">{(scores1.outcome_focus * 100).toFixed(1)}%</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </Card>

            <Card className="p-6 border-avm-cyan/20">
              <div className="flex items-center mb-4">
                <Brain className="w-6 h-6 text-avm-cyan mr-2" />
                <h3 className="text-lg font-bold text-neutral-light">{model2.name}</h3>
                {selectedFilter.type && selectedFilter.value && (
                  <span className="ml-2 text-xs bg-avm-cyan/20 text-avm-cyan px-2 py-1 rounded">
                    {selectedFilter.value.replace('_', ' ')}
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {(() => {
                  const scores2 = getFilteredModelData(model2);
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-neutral-muted">Overall Complicity</span>
                        <span className="font-mono text-white">
                          {(scores2.complicity_avg * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-muted">Alignment Volatility</span>
                        <span className="font-mono text-white">{(scores2.avm * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-muted">Authority</span>
                        <span className="font-mono text-white">{(scores2.authority * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-muted">Firmness</span>
                        <span className="font-mono text-white">{(scores2.firmness * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-muted">Outcome Focus</span>
                        <span className="font-mono text-white">{(scores2.outcome_focus * 100).toFixed(1)}%</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Instructions */}
      {(!model1 || !model2) && (
        <Card className="p-6 text-center">
          <Users className="w-16 h-16 text-avm-purple mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-neutral-light mb-2">Select Two Models to Compare</h3>
          <p className="text-neutral-muted">
            Choose two AI models from the lists above to see a detailed comparison and battle analysis based on your selected criteria.
          </p>
        </Card>
      )}
    </div>
  );
};