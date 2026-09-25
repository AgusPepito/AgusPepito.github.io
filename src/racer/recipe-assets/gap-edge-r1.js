import generate from '../../../public/assets/track/gap-edge-r1.js';
import {mountRecipeAsset} from '../recipe-runtime.js';
export default function asset(THREE,options){return mountRecipeAsset(THREE,generate(THREE,options));}
export const GAP_EDGE_DEPTH=12;
