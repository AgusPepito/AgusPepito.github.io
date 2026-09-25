import brokenArc from './recipe-assets/broken-arc-r1.js';
import relayCrown from './recipe-assets/relay-crown-r1.js';
import serviceBoom from './recipe-assets/service-boom-r1.js';
export {brokenArc,relayCrown,serviceBoom};
export default function dressing(THREE,{kind='ring'}={}){
  const factory={ring:brokenArc,pylon:relayCrown,boom:serviceBoom}[kind];
  if(!factory)throw new Error('Unknown decoration: '+kind);
  return factory(THREE);
}
