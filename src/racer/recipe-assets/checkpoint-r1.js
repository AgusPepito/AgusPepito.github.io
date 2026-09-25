import generate from '../../../public/assets/track/checkpoint-r1.js';
import {mountRecipeAsset} from '../recipe-runtime.js';
export default function asset(THREE,options){return mountRecipeAsset(THREE,generate(THREE,options));}
export const CHECKPOINT_HALF_LENGTH=15;
