import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Users, MessageSquare, Lightbulb, MapPin, AlertTriangle } from 'lucide-react';

interface MirrorPairData {
  pair_id: string;
  conflict_text: string;
  domain: {
    domain_name: string;
  };
  region: {
    region_name: string;
  };
  scenario_type_ref: {
    scenario_type_name: string;
  };
  power_dynamic_ref: {
    power_dynamic_name: string;
  };
  severity_level_ref: {
    severity_level_name: string;
  };
  prompts: Array<{
    prompt_type: string;
    prompt_text: string;
    model_responses: Array<{
      model_identifier: string;
      response_text?: string;
      output_text?: string;
    }>;
  }>;
  harm_categories?: Array<{
    harm_category_name: string;
  }>;
  authority_refs?: Array<{
    authority_ref_text: string;
  }>;
}

const ModelResponse: React.FC<{ response: any, index: number }> = ({ response, index }) => {
  const responseText = response.response_text || response.output_text || '';
  const modelName = response.model_identifier.split('/').pop()?.split(':')[0] || response.model_identifier;
  const provider = response.model_identifier.split('/')[0] || 'Unknown';
  
  const getProviderColor = (provider: string) => {
    const colors: { [key: string]: string } = {
      'openai': 'bg-green-500 text-white border-green-600',
      'anthropic': 'bg-orange-500 text-white border-orange-600',
      'google': 'bg-blue-500 text-white border-blue-600',
      'meta-llama': 'bg-purple-500 text-white border-purple-600',
      'mistralai': 'bg-red-500 text-white border-red-600',
      'deepseek': 'bg-cyan-500 text-white border-cyan-600'
    };
    return colors[provider] || 'bg-gray-500 text-white border-gray-600';
  };

  // Improved text formatting with better handling of formatting issues
  const formatText = (text: string) => {
    // Split by double newlines for paragraphs
    const paragraphs = text.split(/\n\s*\n/);
    
    return paragraphs.map((paragraph, pIndex) => {
      const key = `para-${pIndex}`;
      const trimmedParagraph = paragraph.trim();
      
      if (!trimmedParagraph) return null;
      
      // Headers
      if (trimmedParagraph.startsWith('### ')) {
        return <h3 key={key} className="text-lg font-semibold mb-3 text-white mt-6 first:mt-0">{trimmedParagraph.slice(4)}</h3>;
      }
      if (trimmedParagraph.startsWith('## ')) {
        return <h2 key={key} className="text-xl font-bold mb-3 text-white mt-6 first:mt-0">{trimmedParagraph.slice(3)}</h2>;
      }
      if (trimmedParagraph.startsWith('# ')) {
        return <h1 key={key} className="text-2xl font-bold mb-4 text-white mt-6 first:mt-0">{trimmedParagraph.slice(2)}</h1>;
      }
      
      // Handle lists (both numbered and bulleted)
      const lines = trimmedParagraph.split('\n');
      if (lines.some(line => line.match(/^\s*[-*•]\s/) || line.match(/^\s*\d+\.\s/))) {
        return (
          <div key={key} className="mb-4">
            {lines.map((line, lIndex) => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return null;
              
              if (trimmedLine.match(/^\s*[-*•]\s/) || trimmedLine.match(/^\s*\d+\.\s/)) {
                const content = trimmedLine.replace(/^[-*•]\s*|\d+\.\s*/, '');
                return (
                  <div key={`list-${lIndex}`} className="flex items-start mb-2">
                    <span className="text-avm-cyan mr-2 mt-1">•</span>
                    <span className="text-gray-200 leading-relaxed flex-1">{content}</span>
                  </div>
                );
              }
              return (
                <p key={`line-${lIndex}`} className="text-gray-200 leading-relaxed mb-2">
                  {trimmedLine}
                </p>
              );
            })}
          </div>
        );
      }
      
      // Handle blockquotes
      if (trimmedParagraph.startsWith('"') && trimmedParagraph.endsWith('"')) {
        return (
          <blockquote key={key} className="border-l-4 border-avm-cyan bg-neural-dark/50 pl-4 py-3 my-4 rounded-r-lg">
            <p className="text-gray-200 italic text-lg leading-relaxed">
              {trimmedParagraph}
            </p>
          </blockquote>
        );
      }
      
      // Regular paragraphs with inline formatting
      let formattedText = trimmedParagraph
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic text-avm-cyan">$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-neural-dark px-2 py-1 rounded text-sm font-mono text-green-400">$1</code>');
      
      return (
        <p key={key} className="text-gray-200 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: formattedText }} />
      );
    }).filter(Boolean);
  };

  return (
    <Card className="mb-4 lg:mb-6 hover:bg-neural-darker/90 transition-all duration-200">
      <div className="p-4 lg:p-6 pb-3 lg:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-base lg:text-lg font-semibold text-white">
            Response #{index + 1}
          </h3>
          <div className="flex items-center gap-2 lg:gap-3">
            <Badge className={`${getProviderColor(provider)} px-3 py-1.5 text-sm lg:text-base font-bold`}>
              {provider.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="px-3 py-1.5 text-sm lg:text-base font-medium border-gray-500 text-gray-300">
              {modelName}
            </Badge>
          </div>
        </div>
      </div>
      <div className="px-4 lg:px-6 pb-4 lg:pb-6">
        <ScrollArea className="max-h-[400px] lg:max-h-[500px] pr-2 lg:pr-4">
          <div className="bg-neural-dark/30 rounded-lg p-3 lg:p-4 border border-neural-light/10">
            <div className="text-sm lg:text-base">
              {formatText(responseText)}
            </div>
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};

const MirrorPairExplorer: React.FC = () => {
  const [mirrorPairData, setMirrorPairData] = useState<MirrorPairData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMirrorPairData = async () => {
      try {
        const response = await fetch('/sample_mirror_pair.json');
        if (!response.ok) {
          throw new Error('Failed to load mirror pair data');
        }
        const data = await response.json();
        setMirrorPairData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadMirrorPairData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-avm-purple"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Error Loading Data</h3>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  if (!mirrorPairData) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Data Available</h3>
        <p className="text-gray-400">Mirror pair data could not be loaded.</p>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    const colors: { [key: string]: string } = {
      'low': 'bg-green-100 text-green-800 border-green-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'high': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-avm-purple to-neural-accent text-white p-4 lg:p-6 rounded-lg shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-6 w-6 lg:h-8 lg:w-8" />
          <h1 className="text-xl lg:text-2xl font-bold">Mirror Pair Explorer</h1>
        </div>
        <p className="text-purple-100 text-base lg:text-lg mb-3">
          Explore how different AI models respond to opposing perspectives on the same conflict
        </p>
        <div className="bg-purple-900/30 border border-purple-400/20 rounded-lg p-3 lg:p-4">
          <p className="text-purple-200 text-sm">
            <strong>Note:</strong> We're showing one trivial domestic scenario due to the sensitive nature of the full dataset. 
            This example demonstrates the premise: how AI models navigate opposing viewpoints on the same underlying conflict.
          </p>
        </div>
      </div>

      {/* Scenario Information */}
      <Card className="shadow-md">
        <div className="p-4 lg:p-6 pb-3">
          <h2 className="flex items-center gap-2 text-lg lg:text-xl text-white font-semibold">
            <Lightbulb className="h-5 w-5 lg:h-6 lg:w-6 text-yellow-500" />
            Scenario Overview
          </h2>
        </div>
        <div className="p-4 lg:p-6 pt-0">
          <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-white mb-2">Conflict Description</h3>
                <p className="text-gray-300 bg-neural-dark p-3 rounded-md italic text-sm lg:text-base">
                  "{mirrorPairData.conflict_text}"
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">Domain</h3>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-400" />
                  <span className="text-gray-300 text-sm lg:text-base">{mirrorPairData.domain.domain_name}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 lg:gap-4">
                <div>
                  <h4 className="text-xs lg:text-sm font-medium text-gray-400 mb-2">Region</h4>
                  <Badge variant="outline" className="w-full justify-center text-xs">
                    {mirrorPairData.region.region_name}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-xs lg:text-sm font-medium text-gray-400 mb-2">Scenario Type</h4>
                  <Badge variant="outline" className="w-full justify-center text-xs">
                    {mirrorPairData.scenario_type_ref.scenario_type_name}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-xs lg:text-sm font-medium text-gray-400 mb-2">Power Dynamic</h4>
                  <Badge variant="outline" className="w-full justify-center text-xs">
                    {mirrorPairData.power_dynamic_ref.power_dynamic_name}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-xs lg:text-sm font-medium text-gray-400 mb-2">Severity</h4>
                  <Badge className={`w-full justify-center text-xs ${getSeverityColor(mirrorPairData.severity_level_ref.severity_level_name)}`}>
                    {mirrorPairData.severity_level_ref.severity_level_name}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="text-xs lg:text-sm font-medium text-gray-400 mb-2">Pair ID</h4>
                <code className="bg-neural-dark px-2 py-1 rounded text-xs font-mono text-green-400 break-all">
                  {mirrorPairData.pair_id}
                </code>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Side-by-Side Perspectives Layout */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl lg:text-2xl font-bold text-white mb-2">Mirror Perspectives</h2>
          <p className="text-gray-400 text-sm lg:text-base">Compare how AI models respond to opposing viewpoints on the same conflict</p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
          {mirrorPairData.prompts.map((prompt, promptIndex) => (
            <div key={prompt.prompt_type} className="space-y-4">
              {/* Perspective Header */}
              <Card className={`border-l-4 ${promptIndex === 0 ? 'border-l-blue-500' : 'border-l-purple-500'} bg-gradient-to-r ${promptIndex === 0 ? 'from-blue-900/20 to-blue-800/10' : 'from-purple-900/20 to-purple-800/10'}`}>
                <div className="p-4 lg:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-white font-bold text-sm lg:text-base ${promptIndex === 0 ? 'bg-blue-500' : 'bg-purple-500'}`}>
                      {prompt.prompt_type}
                    </div>
                    <h3 className="text-lg lg:text-xl font-semibold text-white">
                      Perspective {prompt.prompt_type}
                    </h3>
                  </div>
                  <div className={`p-3 lg:p-4 rounded-lg border ${promptIndex === 0 ? 'bg-blue-900/30 border-blue-500/20' : 'bg-purple-900/30 border-purple-500/20'}`}>
                    <p className="text-gray-200 leading-relaxed italic text-sm lg:text-base">
                      "{prompt.prompt_text.trim()}"
                    </p>
                  </div>
                </div>
              </Card>

              {/* Model Responses for this perspective */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <MessageSquare className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                  <h4 className="text-base lg:text-lg font-semibold text-white">
                    AI Responses ({prompt.model_responses.length})
                  </h4>
                </div>
                
                <div className="space-y-4">
                  {prompt.model_responses.map((response, responseIndex) => (
                    <ModelResponse 
                      key={`${prompt.prompt_type}-${responseIndex}`} 
                      response={response} 
                      index={responseIndex} 
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Information */}
      {(mirrorPairData.harm_categories || mirrorPairData.authority_refs) && (
        <Card>
          <div className="p-6 pb-3">
            <h3 className="text-lg text-white font-semibold">Additional Context</h3>
          </div>
          <div className="p-6 pt-0 space-y-4">
            {mirrorPairData.harm_categories && mirrorPairData.harm_categories.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-300 mb-2">Harm Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {mirrorPairData.harm_categories.map((category, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {category.harm_category_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {mirrorPairData.authority_refs && mirrorPairData.authority_refs.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-300 mb-2">Authority References</h4>
                <div className="space-y-2">
                  {mirrorPairData.authority_refs.map((ref, index) => (
                    <p key={index} className="text-sm text-gray-400 bg-neural-dark p-2 rounded">
                      {ref.authority_ref_text}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default MirrorPairExplorer;
