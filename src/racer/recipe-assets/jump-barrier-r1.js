import generate from '../../../public/assets/track/jump-barrier-r1.js';
import {mountRecipeAsset} from '../recipe-runtime.js';
export default function asset(THREE,options){return mountRecipeAsset(THREE,generate(THREE,options));}
export const COMPACT_JAMB_WIDTH=2.25;
export {default as compactPassage} from './compact-passage-r1.js';
