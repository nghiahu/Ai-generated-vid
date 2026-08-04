import { resolveBlueprint } from './resolvers/BlueprintResolver';
import { resolveRegions } from './layout/RegionResolver';
import { solveConstraints } from './layout/ConstraintSolver';
import { calculateGeometry } from './layout/GeometryEngine';
import { planBeats } from './motion/BeatPlanner';
import { resolveBehaviors } from './motion/BehaviorResolver';
import { SceneIntent } from '../../schemas/SceneIntent';
import { SceneContent } from '../../schemas/SceneContent';

export function runPipelineTest() {
  const intent: SceneIntent = {
    sceneIndex: 0,
    duration: 8,
    purpose: 'show_metric',
    emotion: 'powerful',
    tempo: 'medium',
    narrativeMoment: 'peak',
    informationDensity: 'low',
    viewerAction: 'focus_metric',
    emphasis: 'hero',
  };

  const content: SceneContent = {
    heading: 'Hiệu suất thực tế',
    primary: '85%',
    supporting: ['Tiết kiệm 3× thời gian khi tự động hóa quy trình phân tích dữ liệu'],
    voiceover: 'Hiệu suất thực tế đạt 85 phần trăm',
  };

  console.log('[Test] Running blueprint resolver twice...');
  const bp1 = resolveBlueprint(intent, content);
  const bp2 = resolveBlueprint(intent, content);
  
  const bp1Str = JSON.stringify(bp1);
  const bp2Str = JSON.stringify(bp2);
  
  if (bp1Str !== bp2Str) {
    throw new Error('Blueprint resolver is not deterministic!');
  }
  console.log('[Test] Blueprint resolver is deterministic! ✅');

  console.log('[Test] Running layout tree & geometry passes...');
  const regionNodes = resolveRegions(bp1);
  const layoutTree = solveConstraints(regionNodes, bp1);
  const visualTree = calculateGeometry(layoutTree, content, 1080, 1920);
  
  if (visualTree.nodes.length !== 3) {
    throw new Error(`Expected 3 visual nodes, got ${visualTree.nodes.length}`);
  }
  console.log('[Test] Layout and Geometry computed correctly! ✅');

  console.log('[Test] Running beat planner & behavior resolver passes...');
  const beatTimeline = planBeats({ ...intent, componentCount: bp1.components.length }, 30);
  const behaviorTree = resolveBehaviors(layoutTree, beatTimeline, bp1.motionProfile);
  
  if (beatTimeline.beats.length !== 4) {
    throw new Error(`Expected 4 beats, got ${beatTimeline.beats.length}`);
  }
  
  if (behaviorTree.nodes.length !== 3) {
    throw new Error(`Expected 3 behavior node specs, got ${behaviorTree.nodes.length}`);
  }
  console.log('[Test] Beats and BehaviorSpecs computed correctly! ✅');
  
  console.log('[Test] All Pipeline Tests Passed successfully! 🚀');
}
