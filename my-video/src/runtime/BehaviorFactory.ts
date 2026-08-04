import { resolve } from './BehaviorEngine';
import { MotionContext, MotionState } from './MotionState';

export interface BehaviorInstance {
  render(ctx: MotionContext): MotionState;
}

export const BehaviorFactory = {
  create(name: string): BehaviorInstance {
    return {
      render(ctx: MotionContext) {
        return resolve(name, ctx);
      }
    };
  }
};
