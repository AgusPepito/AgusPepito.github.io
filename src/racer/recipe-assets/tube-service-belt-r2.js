import generate from '../../../public/assets/track/tube-service-belt-r2.js';
import {mountRecipeAsset} from '../recipe-runtime.js';
export default function asset(THREE,options){return mountRecipeAsset(THREE,generate(THREE,options));}
export const SERVICE_BELT_LENGTH=12;
export const SERVICE_BELT_VARIANTS=['pipe','cooling','access','armor'];
