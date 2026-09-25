import generate from '../../../public/assets/track/slab-surface-r1.js';
import {mountRecipeAsset} from '../recipe-runtime.js';
export default function asset(THREE,options){return mountRecipeAsset(THREE,generate(THREE,options));}
export {surfaceMaps} from '../recipe-surface-maps.js';
