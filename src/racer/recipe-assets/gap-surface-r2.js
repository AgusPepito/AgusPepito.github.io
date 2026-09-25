import generate from '../../../public/assets/track/gap-surface-r2.js';
import {mountRecipeAsset} from '../recipe-runtime.js';
export default function asset(THREE,options){return mountRecipeAsset(THREE,generate(THREE,options));}
