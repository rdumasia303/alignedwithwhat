import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Line, Html } from '@react-three/drei';
import { LoadingSpinner } from './ui/LoadingSpinner';
import * as THREE from 'three';

interface NeuralNetwork3DProps {
  data?: any;
  isLoading?: boolean;
  compact?: boolean;
}

// Core research insight: Show models positioned by their behavioral dimensions
// X-axis: Authority (0 = unaffiliated, 1 = appeals to authority)
// Y-axis: AVM Score (0 = ethical, 1 = compliant)  
// Z-axis: Firmness (0 = hedging, 1 = decisive)
// Color: Complicity differential (red = biased toward harmful, blue = biased toward helpful)

// Scientific Model Node - positioned by actual behavioral dimensions
const BehavioralModelNode: React.FC<{ 
  position: [number, number, number]; 
  modelName: string;
  avm: number;
  authority: number;
  firmness: number;
  complicityBias: number; // positive = biased toward harmful, negative = toward helpful
  archetype: string;
  isHovered?: boolean;
  onClick: () => void;
}> = ({ position, modelName, avm, authority, firmness, complicityBias, archetype, isHovered, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Color based on complicity bias (research insight: does the model help more with harmful or helpful tasks?)
  const getComplicityColor = (bias: number) => {
    if (bias > 0.3) return '#EF4444'; // Red - biased toward harmful
    if (bias > 0.1) return '#F59E0B'; // Orange - slightly biased toward harmful
    if (bias > -0.1) return '#6B7280'; // Gray - neutral
    if (bias > -0.3) return '#3B82F6'; // Blue - biased toward helpful
    return '#10B981'; // Green - strongly biased toward helpful
  };
  
  useFrame((_state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      if (isHovered) {
        meshRef.current.scale.setScalar(1.3);
      } else {
        meshRef.current.scale.setScalar(1.0);
      }
    }
  });

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <Sphere ref={meshRef} args={[0.3, 16, 16]}>
        <meshStandardMaterial 
          color={getComplicityColor(complicityBias)} 
          emissive={getComplicityColor(complicityBias)} 
          emissiveIntensity={isHovered ? 0.5 : 0.2}
          metalness={0.6}
          roughness={0.3}
        />
      </Sphere>
      
      {/* Show risk level as a ring */}
      {avm > 0.7 && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.5, 16]} />
          <meshBasicMaterial 
            color="#ff0000" 
            transparent 
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Model information */}
      {isHovered && (
        <Html distanceFactor={8}>
          <div className="bg-black/90 text-white px-3 py-2 rounded-lg border border-gray-600 min-w-[200px]">
            <div className="font-bold text-sm">{modelName}</div>
            <div className="text-xs text-gray-300 mt-1">{archetype}</div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
              <div>AVM: {avm.toFixed(2)}</div>
              <div>Authority: {authority.toFixed(2)}</div>
              <div>Firmness: {firmness.toFixed(2)}</div>
              <div>Bias: {complicityBias > 0 ? '+' : ''}{complicityBias.toFixed(2)}</div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Research-driven connections: Show models that cluster in behavioral space
const BehavioralConnections: React.FC<{ nodes: any[] }> = ({ nodes }) => {
  const connections = useMemo(() => {
    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        
        // Calculate behavioral similarity (research insight: models with similar behavioral profiles)
        const avmSimilarity = 1 - Math.abs(node1.avm - node2.avm);
        const authoritySimilarity = 1 - Math.abs(node1.authority - node2.authority);
        const firmnessSimilarity = 1 - Math.abs(node1.firmness - node2.firmness);
        
        const similarity = (avmSimilarity + authoritySimilarity + firmnessSimilarity) / 3;
        
        if (similarity > 0.8) { // Only connect behaviorally similar models
          const distance = Math.sqrt(
            Math.pow(node1.position[0] - node2.position[0], 2) +
            Math.pow(node1.position[1] - node2.position[1], 2) +
            Math.pow(node1.position[2] - node2.position[2], 2)
          );
          
          links.push({
            start: node1.position,
            end: node2.position,
            strength: similarity,
            distance
          });
        }
      }
    }
    return links;
  }, [nodes]);

  return (
    <>
      {connections.map((link, index) => (
        <Line
          key={index}
          points={[link.start, link.end]}
          color="#8B5CF6"
          lineWidth={1}
          transparent
          opacity={link.strength * 0.4}
        />
      ))}
    </>
  );
};

// Scientific Behavioral Analysis Scene
const BehavioralAnalysisScene: React.FC<{ compact: boolean; data?: any }> = ({ compact, data }) => {
  const [hoveredNode, setHoveredNode] = React.useState<number | null>(null);
  
  // Transform research data into 3D behavioral space
  const behavioralNodes = useMemo(() => {
    if (!data?.models) {
      // Demo data showing the research concept
      return [
        { 
          position: [0, 4, 1] as [number, number, number], 
          modelName: 'Mistral (Demo)', 
          avm: 0.95, 
          authority: 0.3, 
          firmness: 0.9, 
          complicityBias: 0.1,
          archetype: 'Unquestioning Pragmatist'
        },
        { 
          position: [-2, 1, -1] as [number, number, number], 
          modelName: 'Llama 4 (Demo)', 
          avm: 0.18, 
          authority: 0.1, 
          firmness: 0.4, 
          complicityBias: -0.4,
          archetype: 'Dogmatic Refuser'
        },
        { 
          position: [2, 3, 0] as [number, number, number], 
          modelName: 'Claude (Demo)', 
          avm: 0.58, 
          authority: 0.7, 
          firmness: 0.8, 
          complicityBias: 0.0,
          archetype: 'Decisive Strategist'
        },
      ];
    }

    return Object.entries(data.models).map(([modelName, modelData]: [string, any]) => {
      const profile = modelData.behavioral_scores || {};
      const mean_avm = modelData.mean_avm || 0.5;
      const authority = profile.authority || 0.5;
      const firmness = profile.firmness || 0.5;
      const complicityA = profile.complicity_a || 0.5;
      const complicityB = profile.complicity_b || 0.5;
      
      // Key research insight: complicity bias (is the model more helpful with harmful or helpful tasks?)
      const complicityBias = complicityA - complicityB; // positive = more helpful with harmful tasks
      
      // Position models in behavioral space:
      // X: Authority (0 = unaffiliated to 1 = appeals to authority)
      // Y: AVM (0 = ethical to 1 = compliant)
      // Z: Firmness (0 = hedging to 1 = decisive)
      const position: [number, number, number] = [
        (authority - 0.5) * 6,      // X-axis: Authority dimension
        (mean_avm - 0.5) * 6,       // Y-axis: AVM (ethical vs compliant)
        (firmness - 0.5) * 6        // Z-axis: Firmness (hedging vs decisive)
      ];
      
      return {
        position,
        modelName: modelName.split(':')[0],
        avm: mean_avm,
        authority,
        firmness,
        complicityBias,
        archetype: modelData.mean_personality?.archetype || 'Unknown',
        originalData: modelData
      };
    });
  }, [data]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, -5, -5]} intensity={0.4} color="#8B5CF6" />
      
      {/* Research axis indicators */}
      <AxisIndicators compact={compact} />
      
      {/* Behavioral similarity connections */}
      <BehavioralConnections nodes={behavioralNodes} />
      
      {/* Model nodes positioned by behavioral dimensions */}
      {behavioralNodes.map((node, index) => (
        <BehavioralModelNode
          key={index}
          position={node.position}
          modelName={node.modelName}
          avm={node.avm}
          authority={node.authority}
          firmness={node.firmness}
          complicityBias={node.complicityBias}
          archetype={node.archetype}
          isHovered={hoveredNode === index}
          onClick={() => setHoveredNode(hoveredNode === index ? null : index)}
        />
      ))}
      
      {!compact && (
        <Text
          position={[0, 3.5, 0]}
          fontSize={0.4}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          AI Behavioral Analysis
        </Text>
      )}
      
      <OrbitControls 
        enableZoom={!compact} 
        enablePan={!compact}
        autoRotate={!compact}
        autoRotateSpeed={0.3}
      />
    </>
  );
};

// Axis indicators to show what the dimensions represent
const AxisIndicators: React.FC<{ compact: boolean }> = ({ compact }) => {
  if (compact) return null;
  
  return (
    <>
      {/* X-axis: Authority */}
      <Line
        points={[[-3, -3, 0], [3, -3, 0]]}
        color="#10B981"
        lineWidth={2}
      />
      <Text
        position={[3.2, -3, 0]}
        fontSize={0.2}
        color="#10B981"
        anchorX="left"
        anchorY="middle"
      >
        Authority →
      </Text>
      
      {/* Y-axis: AVM */}
      <Line
        points={[[-3, -3, 0], [-3, 3, 0]]}
        color="#EF4444"
        lineWidth={2}
      />
      <Text
        position={[-3, 3.2, 0]}
        fontSize={0.2}
        color="#EF4444"
        anchorX="center"
        anchorY="bottom"
      >
        Compliant ↑
      </Text>
      <Text
        position={[-3, -3.3, 0]}
        fontSize={0.2}
        color="#10B981"
        anchorX="center"
        anchorY="top"
      >
        Ethical ↓
      </Text>
      
      {/* Z-axis: Firmness */}
      <Line
        points={[[-3, -3, -3], [-3, -3, 3]]}
        color="#3B82F6"
        lineWidth={2}
      />
      <Text
        position={[-3, -3, 3.2]}
        fontSize={0.2}
        color="#3B82F6"
        anchorX="center"
        anchorY="middle"
      >
        Decisive ↑
      </Text>
    </>
  );
};

export const NeuralNetwork3D: React.FC<NeuralNetwork3DProps> = ({ 
  data, 
  isLoading, 
  compact = false 
}) => {
  if (isLoading) {
    return <LoadingSpinner text="Loading Behavioral Analysis..." />;
  }

  return (
    <div className="w-full h-full relative">
      <Canvas 
        camera={{ position: [5, 3, 8], fov: 60 }}
        gl={{ 
          antialias: false,
          alpha: false,
          preserveDrawingBuffer: false
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            console.warn('WebGL context lost, attempting recovery...');
          });
          
          gl.domElement.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored');
          });
        }}
      >
        <Suspense fallback={null}>
          <BehavioralAnalysisScene compact={compact} data={data} />
        </Suspense>
      </Canvas>
      
      {/* Research insights legend */}
      {!compact && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm">
          <div className="font-bold mb-2">Behavioral Dimensions</div>
          <div className="space-y-1">
            <div><span className="text-green-400">X-axis:</span> Authority (unaffiliated → appeals to authority)</div>
            <div><span className="text-red-400">Y-axis:</span> AVM (ethical → compliant)</div>
            <div><span className="text-blue-400">Z-axis:</span> Firmness (hedging → decisive)</div>
            <div><span className="text-gray-400">Color:</span> Complicity bias (red = harmful-biased, blue = helpful-biased)</div>
          </div>
        </div>
      )}
      
      {/* Controls */}
      {!compact && (
        <div className="absolute bottom-4 right-4 text-gray-400 text-xs">
          <div>Click & Drag: Orbit • Scroll: Zoom</div>
          <div>Hover nodes for details</div>
        </div>
      )}
    </div>
  );
};
