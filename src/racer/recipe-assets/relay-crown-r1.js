import generate from '../../../public/assets/space/relay-crown-r1.js';
import {mountRecipeAsset} from '../recipe-runtime.js';
export default function asset(THREE,options){return mountRecipeAsset(THREE,generate(THREE,options));}
