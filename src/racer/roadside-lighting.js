import edgeLight from './recipe-assets/edge-light-r1.js';

export const EDGE_LIGHT_WIDTH=1;
export const EDGE_ROAD_OVERLAP=.2;
// The source wall's inward foot reaches 1.4 m from its mounting pivot.
export const LIT_WALL_OFFSET=1.4+EDGE_LIGHT_WIDTH-EDGE_ROAD_OVERLAP;

export function mountEdgeLight(THREE,parent,side,{half=18,height=0,z=0,length=12.5,illuminated=true}={}) {
  const module=edgeLight(THREE,{length,illuminated});
  module.position.set(side*(half-EDGE_ROAD_OVERLAP+EDGE_LIGHT_WIDTH/2),height-.16,z);
  parent.add(module);return module;
}
