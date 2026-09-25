import generate from '../../../public/assets/track/service-passage-r1.js';
import {mountRecipeAsset} from '../recipe-runtime.js';
export default function asset(THREE,options){return mountRecipeAsset(THREE,generate(THREE,options));}
export const PASSAGE_JAMB_WIDTH=4.5;
