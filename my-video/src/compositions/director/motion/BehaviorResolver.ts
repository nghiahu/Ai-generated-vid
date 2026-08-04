import { LayoutTree, BehaviorTree, NodeBehaviorSpec } from '../../../schemas';
import { SceneTimeline } from '../../../runtime/TimeModel';

export function resolveBehaviors(
  layoutTree: LayoutTree,
  beatTimeline: SceneTimeline,
  motionProfile: 'powerful' | 'elegant' | 'urgent' | 'calm'
): BehaviorTree {
  const camera = motionProfile === 'powerful' ? 'PushSlow' : 'Static';
  const background = 'GradientFlow';
  const transition = 'Dissolve';
  
  const enterBeats = beatTimeline.beats.map(b => b.id);
  const exitBeat = beatTimeline.beats[beatTimeline.beats.length - 1]?.id || 'beat_4';
  
  const nodes: NodeBehaviorSpec[] = layoutTree.nodes.map((node) => {
    let enterBeat = enterBeats[0] || 'beat_1';
    if (node.region === 'center') {
      enterBeat = enterBeats[1] || 'beat_2';
    } else if (node.region === 'bottom') {
      enterBeat = enterBeats[2] || 'beat_3';
    }
    
    const spec: NodeBehaviorSpec = {
      id: node.slotId,
      lifecycle: {
        enter: {
          behavior: node.type === 'caption' ? 'Cascade' : 'FadeUp',
          beat: enterBeat,
        },
        exit: {
          behavior: 'Dissolve',
          beat: exitBeat,
        }
      }
    };
    
    if (node.type === 'counter' || node.type === 'metric') {
      spec.lifecycle.metric = {
        behavior: 'CountUp',
        beat: enterBeat,
      };
      
      spec.lifecycle.idle = {
        behavior: 'PulseGlow',
        beat: enterBeats[2] || 'beat_3',
      };
    }
    
    return spec;
  });
  
  return {
    camera,
    background,
    transition,
    nodes,
  };
}
